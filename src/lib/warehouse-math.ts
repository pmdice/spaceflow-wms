import { StorageLocation } from '@/types/wms';
import { WAREHOUSE_CONFIG } from './constants';
import * as THREE from 'three';

const { AISLE_SPACING_X, BAY_SPACING_Z, LEVEL_HEIGHT_Y, START_OFFSET } = WAREHOUSE_CONFIG;

// Diese Funktion ist das Herzstück der 3D-Positionierung.
// Sie ist "rein" (pure function) – gleicher Input ergibt immer gleichen Output.
export const calculate3DPosition = (location: StorageLocation): THREE.Vector3 => {

    // Berechnung der X-Position basierend auf der Reihe (Aisle)
    // Wir multiplizieren einfach die Gang-Nummer mit dem Abstand.
    const x = START_OFFSET.x + (location.aisle * AISLE_SPACING_X);

    // Berechnung der Y-Höhe basierend auf der Ebene (Level)
    // Wichtig: Level 1 ist am Boden, also y=0. Deshalb (level - 1).
    const y = START_OFFSET.y + ((location.level - 1) * LEVEL_HEIGHT_Y);

    // Berechnung der Z-Tiefe basierend auf der Sektion (Bay)
    const z = START_OFFSET.z + (location.bay * BAY_SPACING_Z);

    return new THREE.Vector3(x, y, z);
};