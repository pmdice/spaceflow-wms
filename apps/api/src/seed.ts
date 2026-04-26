import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { db } from '@spaceflow/database';
import type { SpatialPallet } from '@spaceflow/wms-types';

const PALLETS_PATH = resolve(__dirname, '../../web/public/data/pallets.json');

async function seed() {
    const pallets: SpatialPallet[] = JSON.parse(readFileSync(PALLETS_PATH, 'utf-8'));

    let upserted = 0;
    for (const p of pallets) {
        await db.pallet.upsert({
            where: { id: p.id },
            update: {},
            create: {
                id: p.id,
                destination: p.destination,
                status: p.status,
                urgency: p.urgency,
                weightKg: p.weightKg,
                lastScannedAt: new Date(p.lastScannedAt),
                locationId: p.logicalAddress.id,
                zone: p.logicalAddress.zone,
                aisle: p.logicalAddress.aisle,
                bay: p.logicalAddress.bay,
                level: p.logicalAddress.level,
            },
        });
        upserted++;
    }

    console.log(`Seeded ${upserted} pallets`);
    await db.$disconnect();
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
