import { create } from 'zustand';
import type { SpatialPallet, LogisticsFilter } from '../types/wms';

interface LogisticsState {
    // Daten
    pallets: SpatialPallet[];           // Die rohen, ungefilterten Daten (Source of Truth)
    filteredPallets: SpatialPallet[];   // Die Daten, die aktuell im UI/3D gezeigt werden
    isLoading: boolean;
    error: string | null;

    // Aktive AI-Filter Settings (z.B. um im 3D Raum Dinge rot leuchten zu lassen)
    activeHighlightColor: string | null;
    hoveredPalletId: string | null;
    selectedPalletId: string | null;
    filterRevision: number;

    // Actions
    fetchData: () => Promise<void>;
    applyAIFilter: (filter: LogisticsFilter) => void;
    resetFilter: () => void;
    setHoveredPalletId: (id: string | null) => void;
    setSelectedPalletId: (id: string | null) => void;
}

export const useLogisticsStore = create<LogisticsState>((set, get) => ({
    pallets: [],
    filteredPallets: [],
    isLoading: false,
    error: null,
    activeHighlightColor: null,
    hoveredPalletId: null,
    selectedPalletId: null,
    filterRevision: 0,

    // 1. Initiales Laden der Mock-Daten
    fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/data/pallets.json');
            if (!response.ok) throw new Error('Failed to fetch pallets data');

            const data: SpatialPallet[] = await response.json();

            // Initial sind alle Paletten sichtbar
            set({ pallets: data, filteredPallets: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    // 2. Die Magie: Hier wird das JSON von OpenAI auf die echten Daten angewendet
    applyAIFilter: (filter) => {
        const { pallets } = get();

        // Wir filtern das Array basierend auf den KI-Parametern
        const result = pallets.filter((pallet) => {
            // Check 1: Destination
            if (filter.destination && !pallet.destination.toLowerCase().includes(filter.destination.toLowerCase())) {
                return false;
            }

            // Check 2: Status
            if (filter.status !== 'all' && pallet.status !== filter.status) {
                return false;
            }

            // Check 3: Urgency
            if (filter.urgencyLevel !== 'all' && pallet.urgency !== filter.urgencyLevel) {
                return false;
            }

            // Check 4: Weight (kg)
            if (filter.weightMinKg !== null && pallet.weightKg < filter.weightMinKg) {
                return false;
            }
            if (filter.weightMaxKg !== null && pallet.weightKg > filter.weightMaxKg) {
                return false;
            }

            return true; // Palette entspricht allen Suchkriterien!
        });

        // Update den Store mit den neuen Resultaten und der Highlight-Farbe
        set({
            filteredPallets: result,
            activeHighlightColor: filter.highlightColor || null,
            hoveredPalletId: null,
            selectedPalletId: null,
            filterRevision: get().filterRevision + 1,
        });
    },

    // 3. Zurücksetzen auf den Normalzustand
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