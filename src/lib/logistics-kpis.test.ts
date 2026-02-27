import { describe, expect, it } from 'vitest';
import { calculateLogisticsKpis } from './logistics-kpis';
import type { PalletEvent, SpatialPallet } from '@/types/wms';

const pallets: SpatialPallet[] = [
    {
        id: 'PAL-1',
        destination: 'Zurich',
        status: 'stored',
        urgency: 'low',
        weightKg: 200,
        lastScannedAt: '2026-02-22T10:00:00.000Z',
        logicalAddress: { id: 'A-1', zone: 'A', aisle: 1, bay: 1, level: 1 },
    },
    {
        id: 'PAL-2',
        destination: 'Basel',
        status: 'delayed',
        urgency: 'high',
        weightKg: 350,
        lastScannedAt: '2026-02-20T08:00:00.000Z',
        logicalAddress: { id: 'B-1', zone: 'B', aisle: 1, bay: 1, level: 1 },
    },
];

const events: PalletEvent[] = [
    { id: '1', palletId: 'PAL-1', type: 'received', at: '2026-02-22T06:00:00.000Z', actor: 'Dock-01', source: 'scanner' },
    { id: '2', palletId: 'PAL-2', type: 'received', at: '2026-02-19T08:00:00.000Z', actor: 'Dock-02', source: 'scanner' },
];

describe('calculateLogisticsKpis', () => {
    it('calculates operational KPIs from pallets and events', () => {
        const kpis = calculateLogisticsKpis(pallets, events, new Date('2026-02-22T12:00:00.000Z'));
        expect(kpis.onTimeHandlingRate).toBe(50);
        expect(kpis.avgDwellHours).toBe(41);
        expect(kpis.staleScans24h).toBe(1);
    });
});
