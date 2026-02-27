import { create } from 'zustand';
import type { SpatialPallet, LogisticsFilter, PalletEvent } from '@/types/wms';
import { filterPallets } from './filter-pallets';
import { buildPalletEvents } from '@/lib/pallet-events';

interface LogisticsState {
    pallets: SpatialPallet[];
    filteredPallets: SpatialPallet[];
    palletEvents: PalletEvent[];
    isLoading: boolean;
    error: string | null;

    activeHighlightColor: string | null;
    hoveredPalletId: string | null;
    selectedPalletId: string | null;
    filterRevision: number;

    fetchData: () => Promise<void>;
    applyAIFilter: (filter: LogisticsFilter) => void;
    resetFilter: () => void;
    setHoveredPalletId: (id: string | null) => void;
    setSelectedPalletId: (id: string | null) => void;
}

export const useLogisticsStore = create<LogisticsState>((set, get) => ({
    pallets: [],
    filteredPallets: [],
    palletEvents: [],
    isLoading: false,
    error: null,
    activeHighlightColor: null,
    hoveredPalletId: null,
    selectedPalletId: null,
    filterRevision: 0,

    fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/data/pallets.json');
            if (!response.ok) throw new Error('Failed to fetch pallets data');

            const data: SpatialPallet[] = await response.json();
            const palletEvents = buildPalletEvents(data);

            set({ pallets: data, filteredPallets: data, palletEvents, isLoading: false });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch pallets data';
            set({ error: message, isLoading: false });
        }
    },

    applyAIFilter: (filter) => {
        const { pallets } = get();
        const result = filterPallets(pallets, filter);

        set({
            filteredPallets: result,
            activeHighlightColor: filter.highlightColor || null,
            hoveredPalletId: null,
            selectedPalletId: null,
            filterRevision: get().filterRevision + 1,
        });
    },

    resetFilter: () => {
        set({
            filteredPallets: get().pallets,
            activeHighlightColor: null,
            hoveredPalletId: null,
            selectedPalletId: null,
            filterRevision: get().filterRevision + 1,
        });
    },

    setHoveredPalletId: (id) => set({ hoveredPalletId: id }),
    setSelectedPalletId: (id) => set({ selectedPalletId: id }),
}));