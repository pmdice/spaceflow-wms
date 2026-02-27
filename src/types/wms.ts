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
    palletId: z.string().nullable()
        .describe("Die konkrete Paletten-ID (z.B. 'PAL-00001') bei direkter Suche. Null, wenn nicht erwähnt."),
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

export const PalletActionSchema = z.enum([
    'receive',
    'putaway',
    'scan',
    'relocate',
    'pick',
    'load',
    'delay',
    'set_destination',
]);

export type PalletAction = z.infer<typeof PalletActionSchema>;

export const LogisticsIntentSchema = z.object({
    intentType: z.enum(['filter', 'action']),
    filter: LogisticsFilterSchema,
    action: PalletActionSchema.nullable(),
    maxTargets: z.number().int().min(1).max(50).default(10),
    targetPalletId: z.string().nullable().default(null),
    targetZone: z.enum(['A', 'B', 'C']).nullable().default(null),
    targetDestination: z.string().nullable().default(null),
});

export type LogisticsIntent = z.infer<typeof LogisticsIntentSchema>;