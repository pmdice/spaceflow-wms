// Diese Werte definieren dein virtuelles Lagerhaus.
// Spiel hier gerne später mit den Werten herum, um den Look anzupassen.

export const WAREHOUSE_CONFIG = {
    // Abstände im Grid (in Three.js Einheiten / Metern)
    AISLE_SPACING_X: 4.0,    // Abstand zwischen den Gängen (Reihen)
    BAY_SPACING_Z: 1.2,      // Breite eines Regalplatzes
    LEVEL_HEIGHT_Y: 1.4,     // Höhe eines Regalfachs

    // Offset, um das Lager zu zentrieren, damit es nicht bei 0,0,0 anfängt
    START_OFFSET: { x: -25, y: 0.7, z: -25 },

    // Visuelle Größe der Paletten-Boxen (Primitives)
    PALLET_SIZE: [1.0, 1.1, 1.0] as [number, number, number], // Breite, Höhe, Tiefe
};