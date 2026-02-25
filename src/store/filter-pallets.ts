import type { LogisticsFilter, SpatialPallet } from '../types/wms';

export function filterPallets(pallets: SpatialPallet[], filter: LogisticsFilter): SpatialPallet[] {
    return pallets.filter((pallet) => {
        if (filter.destination && !pallet.destination.toLowerCase().includes(filter.destination.toLowerCase())) {
            return false;
        }

        if (filter.status !== 'all' && pallet.status !== filter.status) {
            return false;
        }

        if (filter.urgencyLevel !== 'all' && pallet.urgency !== filter.urgencyLevel) {
            return false;
        }

        if (filter.weightMinKg !== null && pallet.weightKg < filter.weightMinKg) {
            return false;
        }

        if (filter.weightMaxKg !== null && pallet.weightKg > filter.weightMaxKg) {
            return false;
        }

        return true;
    });
}
