import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isInventoryRoute = pathname.startsWith("/inventory");

  if (!isDashboardRoute && !isAdminRoute && !isInventoryRoute) {
    return NextResponse.next();
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAdminRoute && session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    // Fail closed if auth validation fails unexpectedly.
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard/:path*", "/admin/:path*", "/inventory/:path*"],
};
