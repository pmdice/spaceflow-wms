import { z } from 'zod';
import { PalletActionSchema } from '@spaceflow/wms-types';

export const ApplyActionBodySchema = z.object({
    action: PalletActionSchema,
    targetZone: z.enum(['A', 'B', 'C']).nullable().optional(),
    targetStatus: z.enum(['stored', 'transit', 'delayed']).nullable().optional(),
    targetDestination: z.string().nullable().optional(),
});

export type ApplyActionBody = z.infer<typeof ApplyActionBodySchema>;
