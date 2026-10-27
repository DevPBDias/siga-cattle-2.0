import { NextResponse, type NextRequest } from "next/server";

/**
 * The authenticated session is intentionally evaluated in the client guard.
 *
 * The application uses the Supabase browser client, which persists its session
 * in localStorage to support offline use. A server-side proxy cannot read that
 * storage, so redirecting here would reject valid authenticated users before
 * `WrapperAuth` can restore their session and permissions.
 *
 * Route authentication and authorisation remain enforced by the protected
 * layout (`WrapperAuth`). API routes must validate their own credentials.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
};
