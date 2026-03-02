import type { PalletEvent, SpatialPallet } from '@/types/wms';

const actorPool = ['Dock-01', 'Ops-Lead', 'Forklift-07', 'Scanner-03'];

export function buildPalletEvents(pallets: SpatialPallet[]): PalletEvent[] {
    const events: PalletEvent[] = [];

    pallets.forEach((pallet, index) => {
        const lastScan = new Date(pallet.lastScannedAt).getTime();
        const receivedAt = new Date(lastScan - 36 * 60 * 60 * 1000 - index * 10 * 60 * 1000);
        const putawayAt = new Date(lastScan - 30 * 60 * 60 * 1000 - index * 8 * 60 * 1000);
        const relocatedAt = new Date(lastScan - 18 * 60 * 60 * 1000);
        const pickedAt = new Date(lastScan - 6 * 60 * 60 * 1000);

        events.push(
            makeEvent(pallet.id, 'received', receivedAt, actorPool[index % actorPool.length], 'scanner'),
            makeEvent(pallet.id, 'putaway', putawayAt, actorPool[(index + 1) % actorPool.length], 'operator'),
            makeEvent(pallet.id, 'scan', new Date(lastScan), actorPool[(index + 2) % actorPool.length], 'scanner'),
        );

        if (index % 3 === 0) {
            events.push(
                makeEvent(
                    pallet.id,
                    'relocated',
                    relocatedAt,
                    actorPool[(index + 3) % actorPool.length],
                    'operator',
                    'Re-slotted for outbound wave',
                ),
            );
        }

        if (pallet.status === 'transit') {
            events.push(makeEvent(pallet.id, 'picked', pickedAt, 'Wave-Picker', 'operator'));
            events.push(makeEvent(pallet.id, 'loaded', new Date(lastScan + 30 * 60 * 1000), 'Dock-02', 'scanner'));
        }

        if (pallet.status === 'delayed') {
            events.push(
                makeEvent(
                    pallet.id,
                    'delay_flagged',
                    new Date(lastScan + 15 * 60 * 1000),
                    'Rule-Engine',
                    'system',
                    'Carrier cutoff missed',
                ),
            );
        }
    });

    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function makeEvent(
    palletId: string,
    type: PalletEvent['type'],
    at: Date,
    actor: string,
    source: PalletEvent['source'],
    note?: string,
): PalletEvent {
    return {
        id: `${palletId}-${type}-${at.getTime()}`,
        palletId,
        type,
        at: at.toISOString(),
        actor,
        source,
        note,
    };
}
