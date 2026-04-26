import { z } from 'zod';

interface StorageLocation {
    id: string;
    zone: string;
    aisle: number;
    bay: number;
    level: number;
}
interface SpatialPallet {
    id: string;
    destination: string;
    status: 'stored' | 'transit' | 'delayed';
    urgency: 'low' | 'medium' | 'high';
    weightKg: number;
    lastScannedAt: string;
    logicalAddress: StorageLocation;
}
type PalletEventType = 'received' | 'putaway' | 'scan' | 'relocated' | 'picked' | 'loaded' | 'delay_flagged';
interface PalletEvent {
    id: string;
    palletId: string;
    type: PalletEventType;
    at: string;
    actor: string;
    source: 'scanner' | 'operator' | 'system';
    note?: string;
}
declare const LogisticsFilterSchema: z.ZodObject<{
    palletId: z.ZodNullable<z.ZodString>;
    destination: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        stored: "stored";
        transit: "transit";
        delayed: "delayed";
        all: "all";
    }>;
    urgencyLevel: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        all: "all";
    }>;
    weightMinKg: z.ZodNullable<z.ZodNumber>;
    weightMaxKg: z.ZodNullable<z.ZodNumber>;
    highlightColor: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
type LogisticsFilter = z.infer<typeof LogisticsFilterSchema>;
declare const PalletActionSchema: z.ZodEnum<{
    putaway: "putaway";
    scan: "scan";
    receive: "receive";
    relocate: "relocate";
    pick: "pick";
    load: "load";
    delay: "delay";
    set_status: "set_status";
    set_destination: "set_destination";
}>;
type PalletAction = z.infer<typeof PalletActionSchema>;
declare const LogisticsIntentSchema: z.ZodObject<{
    intentType: z.ZodEnum<{
        filter: "filter";
        action: "action";
    }>;
    filter: z.ZodObject<{
        palletId: z.ZodNullable<z.ZodString>;
        destination: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            stored: "stored";
            transit: "transit";
            delayed: "delayed";
            all: "all";
        }>;
        urgencyLevel: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            all: "all";
        }>;
        weightMinKg: z.ZodNullable<z.ZodNumber>;
        weightMaxKg: z.ZodNullable<z.ZodNumber>;
        highlightColor: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    action: z.ZodNullable<z.ZodEnum<{
        putaway: "putaway";
        scan: "scan";
        receive: "receive";
        relocate: "relocate";
        pick: "pick";
        load: "load";
        delay: "delay";
        set_status: "set_status";
        set_destination: "set_destination";
    }>>;
    maxTargets: z.ZodDefault<z.ZodNumber>;
    targetPalletId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    targetZone: z.ZodDefault<z.ZodNullable<z.ZodEnum<{
        A: "A";
        B: "B";
        C: "C";
    }>>>;
    targetStatus: z.ZodDefault<z.ZodNullable<z.ZodEnum<{
        stored: "stored";
        transit: "transit";
        delayed: "delayed";
    }>>>;
    targetDestination: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
type LogisticsIntent = z.infer<typeof LogisticsIntentSchema>;

export { type LogisticsFilter, LogisticsFilterSchema, type LogisticsIntent, LogisticsIntentSchema, type PalletAction, PalletActionSchema, type PalletEvent, type PalletEventType, type SpatialPallet, type StorageLocation };
