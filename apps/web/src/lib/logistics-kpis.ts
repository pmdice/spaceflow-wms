import type { PalletEvent, SpatialPallet } from '@/types/wms';

export interface LogisticsKpis {
    onTimeHandlingRate: number;
    avgDwellHours: number;
    staleScans24h: number;
}

const MS_PER_HOUR = 60 * 60 * 1000;

export function calculateLogisticsKpis(
    pallets: SpatialPallet[],
    events: PalletEvent[],
    now = new Date(),
): LogisticsKpis {
    if (pallets.length === 0) {
        return { onTimeHandlingRate: 100, avgDwellHours: 0, staleScans24h: 0 };
    }

    const delayedCount = pallets.filter((pallet) => pallet.status === 'delayed').length;
    const onTimeHandlingRate = ((pallets.length - delayedCount) / pallets.length) * 100;

    const eventMap = groupEventsByPallet(events);
    const avgDwellHours = pallets.reduce((acc, pallet) => {
        const palletEvents = eventMap.get(pallet.id) ?? [];
        const received = palletEvents.find((event) => event.type === 'received');
        const loaded = palletEvents.find((event) => event.type === 'loaded');
        const start = received ? new Date(received.at).getTime() : new Date(pallet.lastScannedAt).getTime();
        const end = loaded ? new Date(loaded.at).getTime() : now.getTime();
        return acc + Math.max(0, (end - start) / MS_PER_HOUR);
    }, 0) / pallets.length;

    const staleScans24h = pallets.filter((pallet) => {
        const ageMs = now.getTime() - new Date(pallet.lastScannedAt).getTime();
        return ageMs > 24 * MS_PER_HOUR;
    }).length;

    return {
        onTimeHandlingRate,
        avgDwellHours,
        staleScans24h,
    };
}

export function groupEventsByPallet(events: PalletEvent[]): Map<string, PalletEvent[]> {
    const map = new Map<string, PalletEvent[]>();

    events.forEach((event) => {
        const current = map.get(event.palletId) ?? [];
        current.push(event);
        current.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        map.set(event.palletId, current);
    });

    return map;
}
