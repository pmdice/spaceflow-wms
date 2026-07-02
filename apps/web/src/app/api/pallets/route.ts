import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '~lib/auth';
import { findAllPallets } from '@spaceflow/pallets';

// Prisma + driver adapter require the Node.js runtime.
export const runtime = 'nodejs';
// Always read fresh from the database; never statically cache warehouse state.
export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pallets = await findAllPallets();
    return NextResponse.json(pallets);
}
