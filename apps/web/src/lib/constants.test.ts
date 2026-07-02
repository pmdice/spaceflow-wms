import { describe, expect, it } from 'vitest';
import { CLAY_PALETTE } from './constants';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe('CLAY_PALETTE', () => {
    it('defines a shelf tint for every warehouse zone', () => {
        expect(Object.keys(CLAY_PALETTE.zoneShelf).sort()).toEqual(['A', 'B', 'C']);
    });

    it('uses valid 6-digit hex colors for every value', () => {
        const allColors = [
            CLAY_PALETTE.base,
            CLAY_PALETTE.zoneShelf.A,
            CLAY_PALETTE.zoneShelf.B,
            CLAY_PALETTE.zoneShelf.C,
            CLAY_PALETTE.urgentGlow,
            CLAY_PALETTE.outline.hover,
            CLAY_PALETTE.outline.selected,
            CLAY_PALETTE.outline.filterDefault,
            CLAY_PALETTE.background,
            CLAY_PALETTE.grid.cell,
            CLAY_PALETTE.grid.section,
        ];

        allColors.forEach((color) => {
            expect(color).toMatch(HEX_COLOR);
        });
    });
});
