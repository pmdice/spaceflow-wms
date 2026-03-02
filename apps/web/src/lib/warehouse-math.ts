import { StorageLocation } from '@/types/wms';
import { WAREHOUSE_CONFIG } from './constants';
import * as THREE from 'three';

const {
    AISLE_WIDTH, BAY_WIDTH, LEVEL_HEIGHT,
    START_OFFSET, SHELF_SIZE, AISLE_COUNT, ZONES
} = WAREHOUSE_CONFIG;

export const calculate3DPosition = (location: StorageLocation): THREE.Vector3 => {
    const zoneIndex = Math.max(0, ZONES.indexOf((location.zone || 'A') as (typeof ZONES)[number]));
    const zoneSpan = (AISLE_COUNT + 1) * (AISLE_WIDTH + SHELF_SIZE[2]) + 4;
    const x = START_OFFSET.x + (zoneIndex * zoneSpan) + (location.aisle * (AISLE_WIDTH + SHELF_SIZE[2]));

    // Keep pallets slightly above the floor plane to avoid z-fighting artifacts.
    const y = START_OFFSET.y + ((location.level - 1) * LEVEL_HEIGHT) + 0.1;

    const z = START_OFFSET.z + (location.bay * BAY_WIDTH);

    return new THREE.Vector3(x, y, z);
};