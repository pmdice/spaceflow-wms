import { describe, expect, it } from 'vitest';
import { getPalletOutline } from './pallet-outline';
import { CLAY_PALETTE } from '@/lib/constants';

describe('getPalletOutline', () => {
    it('returns no outline when nothing applies', () => {
        expect(
            getPalletOutline({ isSelected: false, isHovered: false, isFilterActive: false, highlightColorHex: null }),
        ).toBeNull();
    });

    it('prioritizes selection over hover and filter', () => {
        const result = getPalletOutline({
            isSelected: true,
            isHovered: true,
            isFilterActive: true,
            highlightColorHex: '#ff0000',
        });
        expect(result).toEqual({ color: CLAY_PALETTE.outline.selected, thickness: 3 });
    });

    it('prioritizes hover over filter when not selected', () => {
        const result = getPalletOutline({
            isSelected: false,
            isHovered: true,
            isFilterActive: true,
            highlightColorHex: '#ff0000',
        });
        expect(result).toEqual({ color: CLAY_PALETTE.outline.hover, thickness: 1.5 });
    });

    it('uses the AI filter highlight color when one is provided', () => {
        const result = getPalletOutline({
            isSelected: false,
            isHovered: false,
            isFilterActive: true,
            highlightColorHex: '#ff0000',
        });
        expect(result).toEqual({ color: '#ff0000', thickness: 1.5 });
    });

    it('falls back to the default filter accent color when the AI did not specify one', () => {
        const result = getPalletOutline({
            isSelected: false,
            isHovered: false,
            isFilterActive: true,
            highlightColorHex: null,
        });
        expect(result).toEqual({ color: CLAY_PALETTE.outline.filterDefault, thickness: 1.5 });
    });
});
