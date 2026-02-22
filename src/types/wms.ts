import { z } from 'zod';

// --- 1. Physische Daten (WMS Basis) ---

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

// --- 2. KI Filter Schema (Zod) ---
// Das ist das Schema, das wir an OpenAI schicken und womit wir validieren

export const LogisticsFilterSchema = z.object({
    destination: z.string().nullable().describe("Die exakte Zielstadt (z.B. 'Zürich', 'Bern'). Null, wenn nicht erwähnt."),
    status: z.enum(['all', 'stored', 'transit', 'delayed'])
        .describe("Der Status der Fracht. 'all', wenn nicht spezifisch gefragt."),
    urgencyLevel: z.enum(['all', 'low', 'medium', 'high'])
        .describe("Dringlichkeitsstufe. 'all', wenn nicht erwähnt."),
    highlightColor: z.string().nullable()
        .describe("Ein Hex-Farbcode (z.B. '#ff0000' für rot), wenn der User eine farbliche Markierung wünscht."),
});

// Inferiere den TypeScript Type direkt aus dem Zod Schema! (Senior Move)
export type LogisticsFilter = z.infer<typeof LogisticsFilterSchema>;