// src/lib/constants.ts

// Dimensionen für das Lager-Layout
export const WAREHOUSE_CONFIG = {
    // Wie viele Einheiten haben wir?
    AISLE_COUNT: 5,       // Anzahl der Gänge
    BAYS_PER_AISLE: 8,    // Regalfelder pro Gang
    LEVELS_PER_BAY: 4,    // Ebenen übereinander

    // Physische Abstände (in Metern / Three.js Einheiten)
    AISLE_WIDTH: 3.0,     // Platz zwischen den Regalen (für Stapler)
    BAY_WIDTH: 1.5,       // Breite eines Regalfelds
    LEVEL_HEIGHT: 1.8,    // Höhe einer Ebene

    // Dimensionen der 3D-Modelle
    SHELF_SIZE: [1.4, 1.7, 1.2] as [number, number, number], // B, H, T eines Regalfachs
    PALLET_SIZE: [1.2, 1.0, 1.0] as [number, number, number], // B, H, T der Palette mit Ware

    // Startpunkt, um das Lager zu zentrieren
    START_OFFSET: { x: -8, y: 0, z: -6 },
};