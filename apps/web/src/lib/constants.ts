export const WAREHOUSE_CONFIG = {
    ZONES: ['A', 'B', 'C'] as const,
    AISLE_COUNT: 5,
    BAYS_PER_AISLE: 8,
    LEVELS_PER_BAY: 4,
    AISLE_WIDTH: 3.0,
    BAY_WIDTH: 1.5,
    LEVEL_HEIGHT: 1.8,
    SHELF_SIZE: [1.4, 1.7, 1.2] as [number, number, number],
    PALLET_SIZE: [1.2, 1.0, 1.0] as [number, number, number],
    START_OFFSET: { x: -8, y: 0, z: -6 },
};

const CLAY_ZONE_SHELF_COLORS: Record<string, string> = {
    A: '#ebe4d8',
    B: '#e6dfd0',
    C: '#e0d6c2',
};

// Status-driven pallet colours — the only strongly saturated elements in the
// scene (Mirror's-Edge logic: neutral clay world, accent colour on what matters).
const CLAY_PALLET_STATUS_COLORS: Record<string, string> = {
    stored: '#c9a277', // warm tan — a "box" that reads apart from the pale shelf
    transit: '#3e8494', // muted teal — cool accent that pops against warm clay
    delayed: '#d94f38', // red-orange — the alert state
};

export const CLAY_PALETTE = {
    base: '#f0e9dc',
    zoneShelf: CLAY_ZONE_SHELF_COLORS,
    // Light, calm shelving so the structure recedes and the pallets are the focus.
    shelf: {
        deck: '#efe7d9', // shelf surfaces — near the background, quietly present
        post: '#dccfb9', // uprights — a touch deeper so structure still reads
    },
    palletStatus: CLAY_PALLET_STATUS_COLORS,
    urgentGlow: '#ff5a3c',
    outline: {
        hover: '#8a8073',
        selected: '#2b2620',
        filterDefault: '#BC804C',
    },
    background: '#f5f0e6',
    grid: {
        cell: '#e4dbc8',
        section: '#c9bea8',
    },
};

export function getPalletStatusColor(status: string): string {
    return CLAY_PALLET_STATUS_COLORS[status] ?? CLAY_PALETTE.base;
}
