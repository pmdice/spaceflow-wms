import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/api')) {
        const response = NextResponse.next();
        response.headers.set('X-API-Version', '1.0');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};
