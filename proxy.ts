import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AUTH_REDIRECT_QUERY_PARAM } from "@/utils/constants";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (session) {
    return NextResponse.next();
  }

  const loginURL = new URL("/", request.url);
  loginURL.searchParams.set(
    AUTH_REDIRECT_QUERY_PARAM,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginURL);
}

export const config = {
  matcher: ["/dashboard/:path*", "/session/:path*"],
};