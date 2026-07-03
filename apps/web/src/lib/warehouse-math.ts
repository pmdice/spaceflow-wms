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