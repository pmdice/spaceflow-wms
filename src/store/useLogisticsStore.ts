import { create } from 'zustand';
import type { SpatialPallet, LogisticsFilter, PalletEvent, StorageLocation } from '@/types/wms';
import { filterPallets } from './filter-pallets';
import { buildPalletEvents } from '@/lib/pallet-events';
import { WAREHOUSE_CONFIG } from '@/lib/constants';

type PalletAction = 'receive' | 'putaway' | 'scan' | 'relocate' | 'pick' | 'load' | 'delay';

interface LogisticsState {
    pallets: SpatialPallet[];
    filteredPallets: SpatialPallet[];
    palletEvents: PalletEvent[];
    activeFilter: LogisticsFilter | null;
    isLoading: boolean;
    error: string | null;

    activeHighlightColor: string | null;
    hoveredPalletId: string | null;
    selectedPalletId: string | null;
    filterRevision: number;
    isSimulationRunning: boolean;
    simulationSpeedMs: number;

    fetchData: () => Promise<void>;
    applyAIFilter: (filter: LogisticsFilter) => void;
    resetFilter: () => void;
    applyPalletAction: (palletId: string, action: PalletAction) => void;
    simulateTick: () => void;
    startSimulation: () => void;
    stopSimulation: () => void;
    setSimulationSpeed: (speedMs: number) => void;
    setHoveredPalletId: (id: string | null) => void;
    setSelectedPalletId: (id: string | null) => void;
}

let simulationTimer: number | null = null;

export const useLogisticsStore = create<LogisticsState>((set, get) => ({
    pallets: [],
    filteredPallets: [],
    palletEvents: [],
    activeFilter: null,
    isLoading: false,
    error: null,
    activeHighlightColor: null,
    hoveredPalletId: null,
    selectedPalletId: null,
    filterRevision: 0,
    isSimulationRunning: false,
    simulationSpeedMs: 2500,

    fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/data/pallets.json');
            if (!response.ok) throw new Error('Failed to fetch pallets data');

            const data: SpatialPallet[] = await response.json();
            const palletEvents = buildPalletEvents(data);

            set({ pallets: data, filteredPallets: data, palletEvents, activeFilter: null, isLoading: false });
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
            activeFilter: filter,
            activeHighlightColor: filter.highlightColor || null,
            hoveredPalletId: null,
            selectedPalletId: null,
            filterRevision: get().filterRevision + 1,
        });
    },

    resetFilter: () => {
        set({
            filteredPallets: get().pallets,
            activeFilter: null,
            activeHighlightColor: null,
            hoveredPalletId: null,
            selectedPalletId: null,
            filterRevision: get().filterRevision + 1,
        });
    },

    applyPalletAction: (palletId, action) => {
        const state = get();
        const pallet = state.pallets.find((item) => item.id === palletId);
        if (!pallet) return;

        const timestamp = new Date().toISOString();
        const updatedPallet = mutatePalletForAction(pallet, action, timestamp, state.pallets);
        const event = makeActionEvent(updatedPallet.id, action, timestamp);

        const updatedPallets = state.pallets.map((item) => (item.id === palletId ? updatedPallet : item));
        const updatedFiltered = state.activeFilter
            ? filterPallets(updatedPallets, state.activeFilter)
            : updatedPallets;

        set({
            pallets: updatedPallets,
            filteredPallets: updatedFiltered,
            palletEvents: [event, ...state.palletEvents],
            filterRevision: state.filterRevision + 1,
        });
    },

    simulateTick: () => {
        const state = get();
        if (state.pallets.length === 0) return;

        const pallet = state.pallets[Math.floor(Math.random() * state.pallets.length)];
        const actionPool: Record<SpatialPallet['status'], PalletAction[]> = {
            stored: ['scan', 'relocate', 'pick', 'delay'],
            transit: ['scan', 'load', 'delay'],
            delayed: ['scan', 'putaway', 'pick', 'receive'],
        };
        const choices = actionPool[pallet.status];
        const action = choices[Math.floor(Math.random() * choices.length)];
        state.applyPalletAction(pallet.id, action);
    },

    startSimulation: () => {
        if (simulationTimer !== null) return;
        if (typeof window === 'undefined') return;

        set({ isSimulationRunning: true });
        simulationTimer = window.setInterval(() => {
            get().simulateTick();
        }, get().simulationSpeedMs);
    },

    stopSimulation: () => {
        if (simulationTimer !== null && typeof window !== 'undefined') {
            window.clearInterval(simulationTimer);
            simulationTimer = null;
        }
        set({ isSimulationRunning: false });
    },

    setSimulationSpeed: (speedMs) => {
        const nextSpeed = Math.max(500, speedMs);
        set({ simulationSpeedMs: nextSpeed });

        if (simulationTimer !== null && typeof window !== 'undefined') {
            window.clearInterval(simulationTimer);
            simulationTimer = window.setInterval(() => {
                get().simulateTick();
            }, nextSpeed);
        }
    },

    setHoveredPalletId: (id) => set({ hoveredPalletId: id }),
    setSelectedPalletId: (id) => set({ selectedPalletId: id }),
}));

function relocatePallet(pallet: SpatialPallet, allPallets: SpatialPallet[]): SpatialPallet {
    const occupied = new Set(
        allPallets
            .filter((item) => item.id !== pallet.id)
            .map((item) => item.logicalAddress.id),
    );

    const nextLocation = findNextFreeLocation(pallet.logicalAddress, occupied);
    if (!nextLocation) {
        return pallet;
    }

    return {
        ...pallet,
        logicalAddress: nextLocation,
    };
}

function findNextFreeLocation(current: StorageLocation, occupied: Set<string>): StorageLocation | null {
    const totalSlots = WAREHOUSE_CONFIG.AISLE_COUNT * WAREHOUSE_CONFIG.BAYS_PER_AISLE * WAREHOUSE_CONFIG.LEVELS_PER_BAY;
    const toIndex = (loc: StorageLocation) =>
        (((loc.aisle - 1) * WAREHOUSE_CONFIG.BAYS_PER_AISLE + (loc.bay - 1)) * WAREHOUSE_CONFIG.LEVELS_PER_BAY) + (loc.level - 1);
    const fromIndex = (index: number): Omit<StorageLocation, 'id' | 'zone'> => {
        const aisleSpan = WAREHOUSE_CONFIG.BAYS_PER_AISLE * WAREHOUSE_CONFIG.LEVELS_PER_BAY;
        const aisle = Math.floor(index / aisleSpan) + 1;
        const bayLevelOffset = index % aisleSpan;
        const bay = Math.floor(bayLevelOffset / WAREHOUSE_CONFIG.LEVELS_PER_BAY) + 1;
        const level = (bayLevelOffset % WAREHOUSE_CONFIG.LEVELS_PER_BAY) + 1;
        return { aisle, bay, level };
    };

    const start = toIndex(current);
    for (let step = 1; step <= totalSlots; step += 1) {
        const idx = (start + step) % totalSlots;
        const slot = fromIndex(idx);
        const id = formatLocationId(current.zone, slot.aisle, slot.bay, slot.level);
        if (!occupied.has(id)) {
            return {
                id,
                zone: current.zone,
                aisle: slot.aisle,
                bay: slot.bay,
                level: slot.level,
            };
        }
    }

    return null;
}

function formatLocationId(zone: string, aisle: number, bay: number, level: number): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `LOC-${zone}-${pad(aisle)}-${pad(bay)}-${pad(level)}`;
}

function mutatePalletForAction(
    pallet: SpatialPallet,
    action: PalletAction,
    timestamp: string,
    allPallets: SpatialPallet[],
): SpatialPallet {
    const next = { ...pallet, lastScannedAt: timestamp };
    switch (action) {
        case 'receive':
        case 'putaway':
            return { ...next, status: 'stored' };
        case 'pick':
        case 'load':
            return { ...next, status: 'transit' };
        case 'delay':
            return { ...next, status: 'delayed', urgency: 'high' };
        case 'relocate':
            return relocatePallet(next, allPallets);
        case 'scan':
        default:
            return next;
    }
}

function makeActionEvent(palletId: string, action: PalletAction, timestamp: string): PalletEvent {
    const actionMeta: Record<PalletAction, { type: PalletEvent['type']; actor: string; source: PalletEvent['source']; note?: string }> = {
        receive: { type: 'received', actor: 'Dock-Intake', source: 'scanner' },
        putaway: { type: 'putaway', actor: 'Forklift-01', source: 'operator' },
        scan: { type: 'scan', actor: 'Scanner-Edge', source: 'scanner' },
        relocate: { type: 'relocated', actor: 'Forklift-02', source: 'operator', note: 'Dynamic re-slotting' },
        pick: { type: 'picked', actor: 'Wave-Picker', source: 'operator' },
        load: { type: 'loaded', actor: 'Dock-Load', source: 'scanner' },
        delay: { type: 'delay_flagged', actor: 'Rule-Engine', source: 'system', note: 'Operational delay detected' },
    };

    const meta = actionMeta[action];
    return {
        id: `${palletId}-${meta.type}-${Date.now()}`,
        palletId,
        type: meta.type,
        at: timestamp,
        actor: meta.actor,
        source: meta.source,
        note: meta.note,
    };
}