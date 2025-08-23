import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export default async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token")

  // Protect dashboard and chat routes
  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/chat")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
