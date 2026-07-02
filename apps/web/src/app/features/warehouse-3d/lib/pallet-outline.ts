import { CLAY_PALETTE } from '@/lib/constants';

export type PalletOutline = { color: string; thickness: number } | null;

export function getPalletOutline({
    isSelected,
    isHovered,
    isFilterActive,
    highlightColorHex,
}: {
    isSelected: boolean;
    isHovered: boolean;
    isFilterActive: boolean;
    highlightColorHex: string | null;
}): PalletOutline {
    if (isSelected) {
        return { color: CLAY_PALETTE.outline.selected, thickness: 3 };
    }
    if (isHovered) {
        return { color: CLAY_PALETTE.outline.hover, thickness: 1.5 };
    }
    if (isFilterActive) {
        return { color: highlightColorHex ?? CLAY_PALETTE.outline.filterDefault, thickness: 1.5 };
    }
    return null;
}
