// src/lib/warehouse-math.ts
import { StorageLocation } from '@/types/wms';
import { WAREHOUSE_CONFIG } from './constants';
import * as THREE from 'three';

const {
    AISLE_WIDTH, BAY_WIDTH, LEVEL_HEIGHT,
    START_OFFSET, SHELF_SIZE
} = WAREHOUSE_CONFIG;

export const calculate3DPosition = (location: StorageLocation): THREE.Vector3 => {
    // X: Gang-Position + halbe Regalbreite (da der Ursprung mittig ist)
    const x = START_OFFSET.x + (location.aisle * (AISLE_WIDTH + SHELF_SIZE[2]));

    // Y: Ebenen-Höhe. Level 1 ist unten. Wir addieren etwas Offset, damit die Palette AUF dem Boden steht.
    const y = START_OFFSET.y + ((location.level - 1) * LEVEL_HEIGHT) + 0.1;

    // Z: Position im Gang
    const z = START_OFFSET.z + (location.bay * BAY_WIDTH);

    return new THREE.Vector3(x, y, z);
};