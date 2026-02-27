import { z } from 'zod';

export interface StorageLocation {
    id: string;
    zone: string;
    aisle: number;
    bay: number;
    level: number;
}

export interface SpatialPallet {
    id: string;
    destination: string;
    status: 'stored' | 'transit' | 'delayed';
    urgency: 'low' | 'medium' | 'high';
    weightKg: number;
    lastScannedAt: string;
    logicalAddress: StorageLocation;
}

export type PalletEventType =
    | 'received'
    | 'putaway'
    | 'scan'
    | 'relocated'
    | 'picked'
    | 'loaded'
    | 'delay_flagged';

export interface PalletEvent {
    id: string;
    palletId: string;
    type: PalletEventType;
    at: string;
    actor: string;
    source: 'scanner' | 'operator' | 'system';
    note?: string;
}

export const LogisticsFilterSchema = z.object({
    destination: z.string().nullable().describe("Die exakte Zielstadt (z.B. 'Zürich', 'Bern'). Null, wenn nicht erwähnt."),
    status: z.enum(['all', 'stored', 'transit', 'delayed'])
        .describe("Der Status der Fracht. 'all', wenn nicht spezifisch gefragt."),
    urgencyLevel: z.enum(['all', 'low', 'medium', 'high'])
        .describe("Dringlichkeitsstufe. 'all', wenn nicht erwähnt."),
    weightMinKg: z.number().nullable()
        .describe("Minimales Gewicht in kg. Beispiel: 'über 300kg' => 300. Null, wenn nicht erwähnt."),
    weightMaxKg: z.number().nullable()
        .describe("Maximales Gewicht in kg. Beispiel: 'unter 300kg' => 300. Null, wenn nicht erwähnt."),
    highlightColor: z.string().nullable()
        .describe("Ein Hex-Farbcode (z.B. '#ff0000' für rot), wenn der User eine farbliche Markierung wünscht."),
});

export type LogisticsFilter = z.infer<typeof LogisticsFilterSchema>;