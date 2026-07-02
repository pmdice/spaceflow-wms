import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '~lib/auth';
import {
    applyPalletAction,
    PalletValidationError,
    PalletNotFoundError,
} from '@spaceflow/pallets';

// Prisma + driver adapter require the Node.js runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        const result = await applyPalletAction(id, body);
        return NextResponse.json(result);
    } catch (err) {
        if (err instanceof PalletValidationError) {
            return NextResponse.json({ error: 'Invalid action payload', issues: err.issues }, { status: 400 });
        }
        if (err instanceof PalletNotFoundError) {
            return NextResponse.json({ error: err.message }, { status: 404 });
        }
        throw err;
    }
}
