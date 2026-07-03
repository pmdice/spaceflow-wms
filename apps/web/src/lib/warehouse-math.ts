import { StorageLocation } from '@/types/wms';
import { WAREHOUSE_CONFIG } from './constants';
import * as THREE from 'three';

const {
    AISLE_WIDTH, BAY_WIDTH, LEVEL_HEIGHT,
    START_OFFSET, SHELF_SIZE, AISLE_COUNT, ZONES
} = WAREHOUSE_CONFIG;

// X position of an aisle's rack row. Bays share this X; only bay (Z) varies within a row.
export const calculateAisleX = (zone: string, aisle: number): number => {
    const zoneIndex = Math.max(0, ZONES.indexOf((zone || 'A') as (typeof ZONES)[number]));
    const zoneSpan = (AISLE_COUNT + 1) * (AISLE_WIDTH + SHELF_SIZE[2]) + 4;
    return START_OFFSET.x + (zoneIndex * zoneSpan) + (aisle * (AISLE_WIDTH + SHELF_SIZE[2]));
};

// Z position of a bay's centre along a rack row.
export const calculateBayZ = (bay: number): number => START_OFFSET.z + (bay * BAY_WIDTH);

export const calculate3DPosition = (location: StorageLocation): THREE.Vector3 => {
    const x = calculateAisleX(location.zone, location.aisle);

    // Keep pallets slightly above the floor plane to avoid z-fighting artifacts.
    const y = START_OFFSET.y + ((location.level - 1) * LEVEL_HEIGHT) + 0.1;

    const z = calculateBayZ(location.bay);

    return new THREE.Vector3(x, y, z);
};

// ── Rack-row + zone layout (shared by shelving, staging plates, and framing) ──

const ROW_PADDING_BAYS = 1;
const SHELF_HALF_X = SHELF_SIZE[0] / 2;

type PalletLike = { logicalAddress: { zone: string; aisle: number; bay: number } };

export type RackRowExtent = {
    zone: string;
    aisle: number;
    x: number;
    firstBay: number;
    lastBay: number;
    zStart: number;
    zEnd: number;
};

// Group pallets into occupied rack rows: one row per (zone, aisle), spanning the
// occupied bay range padded by a bay. Empty aisles yield no row.
export const groupRackRows = (pallets: PalletLike[]): RackRowExtent[] => {
    const groups = new Map<string, { zone: string; aisle: number; minBay: number; maxBay: number }>();

    for (const pallet of pallets) {
        const { zone, aisle, bay } = pallet.logicalAddress;
        const key = `${zone}:${aisle}`;
        const existing = groups.get(key);
        if (existing) {
            existing.minBay = Math.min(existing.minBay, bay);
            existing.maxBay = Math.max(existing.maxBay, bay);
        } else {
            groups.set(key, { zone, aisle, minBay: bay, maxBay: bay });
        }
    }

    return Array.from(groups.values()).map(({ zone, aisle, minBay, maxBay }) => {
        const firstBay = Math.max(1, minBay - ROW_PADDING_BAYS);
        const lastBay = maxBay + ROW_PADDING_BAYS;
        return {
            zone,
            aisle,
            x: calculateAisleX(zone, aisle),
            firstBay,
            lastBay,
            zStart: calculateBayZ(firstBay) - BAY_WIDTH / 2,
            zEnd: calculateBayZ(lastBay) + BAY_WIDTH / 2,
        };
    });
};

export type ZoneBounds = {
    zone: string;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    centerX: number;
    centerZ: number;
};

export type WarehouseLayout = {
    zones: ZoneBounds[];
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number; centerX: number; centerZ: number } | null;
};

// Per-zone and overall floor footprints, derived from the occupied rack rows —
// used to size the diorama base, zone plates, and camera framing.
export const computeWarehouseLayout = (pallets: PalletLike[]): WarehouseLayout => {
    const rows = groupRackRows(pallets);
    if (rows.length === 0) return { zones: [], bounds: null };

    const byZone = new Map<string, { minX: number; maxX: number; minZ: number; maxZ: number }>();
    for (const row of rows) {
        const box = byZone.get(row.zone) ?? { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
        box.minX = Math.min(box.minX, row.x - SHELF_HALF_X);
        box.maxX = Math.max(box.maxX, row.x + SHELF_HALF_X);
        box.minZ = Math.min(box.minZ, row.zStart);
        box.maxZ = Math.max(box.maxZ, row.zEnd);
        byZone.set(row.zone, box);
    }

    const zones: ZoneBounds[] = Array.from(byZone.entries())
        .map(([zone, box]) => ({
            zone,
            ...box,
            centerX: (box.minX + box.maxX) / 2,
            centerZ: (box.minZ + box.maxZ) / 2,
        }))
        .sort((a, b) => a.zone.localeCompare(b.zone));

    const bounds = zones.reduce(
        (acc, z) => ({
            minX: Math.min(acc.minX, z.minX),
            maxX: Math.max(acc.maxX, z.maxX),
            minZ: Math.min(acc.minZ, z.minZ),
            maxZ: Math.max(acc.maxZ, z.maxZ),
        }),
        { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
    );

    return {
        zones,
        bounds: {
            ...bounds,
            centerX: (bounds.minX + bounds.maxX) / 2,
            centerZ: (bounds.minZ + bounds.maxZ) / 2,
        },
    };
};