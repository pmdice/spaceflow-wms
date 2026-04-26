import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db, $Enums } from '@spaceflow/database';
import type { Pallet } from '@spaceflow/database';
import type { SpatialPallet, PalletEvent, PalletAction } from '@spaceflow/wms-types';
import { ApplyActionBodySchema } from './dto/apply-action.dto';

const WAREHOUSE = {
    AISLE_COUNT: 5,
    BAYS_PER_AISLE: 8,
    LEVELS_PER_BAY: 4,
} as const;

@Injectable()
export class PalletsService {
    async findAll(): Promise<SpatialPallet[]> {
        const pallets = await db.pallet.findMany({ orderBy: { id: 'asc' } });
        return pallets.map(toSpatialPallet);
    }

    async applyAction(id: string, rawBody: unknown): Promise<{ pallet: SpatialPallet; event: PalletEvent }> {
        const parsed = ApplyActionBodySchema.safeParse(rawBody);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.issues);
        }

        const { action, targetZone, targetStatus, targetDestination } = parsed.data;
        const pallet = await db.pallet.findUnique({ where: { id } });
        if (!pallet) throw new NotFoundException(`Pallet ${id} not found`);

        const timestamp = new Date();
        const allPallets = action === 'relocate'
            ? await db.pallet.findMany({ select: { id: true, zone: true, aisle: true, bay: true, level: true } })
            : [];

        const updated = mutatePallet(pallet, action, timestamp, allPallets, {
            targetZone: targetZone ?? null,
            targetStatus: targetStatus ?? null,
            targetDestination: targetDestination ?? null,
        });

        const eventId = `${id}-${action}-${timestamp.getTime()}`;
        const eventMeta = ACTION_EVENT_META[action];

        const [savedPallet, savedEvent] = await db.$transaction([
            db.pallet.update({
                where: { id },
                data: {
                    status: updated.status,
                    urgency: updated.urgency,
                    destination: updated.destination,
                    lastScannedAt: updated.lastScannedAt,
                    locationId: updated.locationId,
                    zone: updated.zone,
                    aisle: updated.aisle,
                    bay: updated.bay,
                    level: updated.level,
                },
            }),
            db.palletEvent.create({
                data: {
                    id: eventId,
                    palletId: id,
                    type: eventMeta.type as $Enums.PalletEventType,
                    at: timestamp,
                    actor: eventMeta.actor,
                    source: eventMeta.source,
                    note: eventMeta.note ?? null,
                },
            }),
        ]);

        return {
            pallet: toSpatialPallet(savedPallet),
            event: toWmsPalletEvent(savedEvent),
        };
    }
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

function toSpatialPallet(p: Pallet): SpatialPallet {
    return {
        id: p.id,
        destination: p.destination,
        status: p.status as SpatialPallet['status'],
        urgency: p.urgency as SpatialPallet['urgency'],
        weightKg: p.weightKg,
        lastScannedAt: p.lastScannedAt.toISOString(),
        logicalAddress: {
            id: p.locationId,
            zone: p.zone,
            aisle: p.aisle,
            bay: p.bay,
            level: p.level,
        },
    };
}

function toWmsPalletEvent(e: {
    id: string; palletId: string; type: string; at: Date;
    actor: string; source: string; note: string | null;
}): PalletEvent {
    return {
        id: e.id,
        palletId: e.palletId,
        type: e.type as PalletEvent['type'],
        at: e.at.toISOString(),
        actor: e.actor,
        source: e.source as PalletEvent['source'],
        note: e.note ?? undefined,
    };
}

// ── Mutation logic (mirrors useLogisticsStore) ────────────────────────────────

type PalletRow = Pick<Pallet, 'id' | 'zone' | 'aisle' | 'bay' | 'level'>;

function mutatePallet(
    pallet: Pallet,
    action: PalletAction,
    timestamp: Date,
    allPallets: PalletRow[],
    overrides: { targetZone: string | null; targetStatus: string | null; targetDestination: string | null },
): Pallet {
    const next = { ...pallet, lastScannedAt: timestamp };
    switch (action) {
        case 'receive':
        case 'putaway':
            return { ...next, status: 'stored' };
        case 'pick':
        case 'load':
            return { ...next, status: 'transit' };
        case 'delay':
            return { ...next, status: 'delayed', urgency: 'high' };
        case 'relocate': {
            const zone = (overrides.targetZone ?? pallet.zone) as 'A' | 'B' | 'C';
            const occupied = new Set(
                allPallets.filter((p) => p.id !== pallet.id).map((p) => `${p.zone}-${p.aisle}-${p.bay}-${p.level}`),
            );
            const loc = findNextFreeLocation({ zone, aisle: pallet.aisle, bay: pallet.bay, level: pallet.level }, occupied);
            if (!loc) return next;
            return { ...next, zone: loc.zone, aisle: loc.aisle, bay: loc.bay, level: loc.level, locationId: formatLocationId(loc) };
        }
        case 'set_status':
            return overrides.targetStatus
                ? { ...next, status: overrides.targetStatus as Pallet['status'] }
                : next;
        case 'set_destination':
            return overrides.targetDestination
                ? { ...next, destination: normalizeDestination(overrides.targetDestination) }
                : next;
        case 'scan':
        default:
            return next;
    }
}

function findNextFreeLocation(
    current: { zone: string; aisle: number; bay: number; level: number },
    occupied: Set<string>,
): { zone: string; aisle: number; bay: number; level: number } | null {
    const { AISLE_COUNT, BAYS_PER_AISLE, LEVELS_PER_BAY } = WAREHOUSE;
    const totalSlots = AISLE_COUNT * BAYS_PER_AISLE * LEVELS_PER_BAY;
    const aisleSpan = BAYS_PER_AISLE * LEVELS_PER_BAY;

    const toIndex = (a: number, b: number, l: number) => (a - 1) * aisleSpan + (b - 1) * LEVELS_PER_BAY + (l - 1);
    const fromIndex = (i: number) => ({
        aisle: Math.floor(i / aisleSpan) + 1,
        bay: Math.floor((i % aisleSpan) / LEVELS_PER_BAY) + 1,
        level: (i % LEVELS_PER_BAY) + 1,
    });

    const start = toIndex(current.aisle, current.bay, current.level);
    for (let step = 1; step <= totalSlots; step++) {
        const idx = (start + step) % totalSlots;
        const slot = fromIndex(idx);
        if (!occupied.has(`${current.zone}-${slot.aisle}-${slot.bay}-${slot.level}`)) {
            return { zone: current.zone, ...slot };
        }
    }
    return null;
}

function formatLocationId(loc: { zone: string; aisle: number; bay: number; level: number }): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `LOC-${loc.zone}-${pad(loc.aisle)}-${pad(loc.bay)}-${pad(loc.level)}`;
}

function normalizeDestination(value: string): string {
    const v = value.trim();
    return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

const ACTION_EVENT_META: Record<PalletAction, { type: string; actor: string; source: 'scanner' | 'operator' | 'system'; note?: string }> = {
    receive:          { type: 'received',     actor: 'Dock-Intake',   source: 'scanner' },
    putaway:          { type: 'putaway',       actor: 'Forklift-01',   source: 'operator' },
    scan:             { type: 'scan',          actor: 'Scanner-Edge',  source: 'scanner' },
    relocate:         { type: 'relocated',     actor: 'Forklift-02',   source: 'operator', note: 'Dynamic re-slotting' },
    pick:             { type: 'picked',        actor: 'Wave-Picker',   source: 'operator' },
    load:             { type: 'loaded',        actor: 'Dock-Load',     source: 'scanner' },
    delay:            { type: 'delay_flagged', actor: 'Rule-Engine',   source: 'system',   note: 'Operational delay detected' },
    set_status:       { type: 'scan',          actor: 'Ops-Console',   source: 'operator', note: 'Status updated' },
    set_destination:  { type: 'scan',          actor: 'Ops-Console',   source: 'operator', note: 'Destination updated' },
};
