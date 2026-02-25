import { describe, expect, it } from 'vitest';
import type { LogisticsFilter, SpatialPallet } from '../types/wms';
import { filterPallets } from './filter-pallets';

const pallets: SpatialPallet[] = [
    {
        id: 'P-001',
        destination: 'Basel',
        status: 'delayed',
        urgency: 'high',
        weightKg: 620,
        lastScannedAt: '2026-01-02T09:00:00.000Z',
        logicalAddress: { id: 'A-01-02-1', zone: 'A', aisle: 1, bay: 2, level: 1 },
    },
    {
        id: 'P-002',
        destination: 'Zurich',
        status: 'stored',
        urgency: 'low',
        weightKg: 180,
        lastScannedAt: '2026-01-03T09:00:00.000Z',
        logicalAddress: { id: 'B-02-04-2', zone: 'B', aisle: 2, bay: 4, level: 2 },
    },
    {
        id: 'P-003',
        destination: 'Basel',
        status: 'transit',
        urgency: 'medium',
        weightKg: 320,
        lastScannedAt: '2026-01-04T09:00:00.000Z',
        logicalAddress: { id: 'C-03-01-1', zone: 'C', aisle: 3, bay: 1, level: 1 },
    },
];

function makeFilter(overrides: Partial<LogisticsFilter>): LogisticsFilter {
    return {
        destination: null,
        status: 'all',
        urgencyLevel: 'all',
        weightMinKg: null,
        weightMaxKg: null,
        highlightColor: null,
        ...overrides,
    };
}

describe('filterPallets', () => {
    it('filters by destination case-insensitively', () => {
        const result = filterPallets(pallets, makeFilter({ destination: 'basel' }));
        expect(result.map((item) => item.id)).toEqual(['P-001', 'P-003']);
    });

    it('filters by status and urgency', () => {
        const result = filterPallets(
            pallets,
            makeFilter({ status: 'delayed', urgencyLevel: 'high' }),
        );
        expect(result.map((item) => item.id)).toEqual(['P-001']);
    });

    it('filters by weight range', () => {
        const result = filterPallets(
            pallets,
            makeFilter({ weightMinKg: 200, weightMaxKg: 400 }),
        );
        expect(result.map((item) => item.id)).toEqual(['P-003']);
    });
});
