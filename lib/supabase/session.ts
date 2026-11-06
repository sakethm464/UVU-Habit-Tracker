import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "./env";

const GUEST_ONLY = ["/welcome", "/login", "/signup", "/forgot-password"];
const ALWAYS_PUBLIC = ["/auth", "/reset-password"];

const matches = (path: string, bases: string[]) => bases.some((b) => path === b || path.startsWith(b + "/"));

/** Refreshes the Supabase session cookie and applies route guarding. Called from proxy.ts. */
export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.next({ request }); // not configured yet: let pages render a setup notice

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const redirectTo = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (path === "/") return redirectTo(user ? "/today" : "/welcome");
  if (matches(path, ALWAYS_PUBLIC)) return response;
  if (matches(path, GUEST_ONLY)) return user ? redirectTo("/today") : response;
  if (!user) return redirectTo("/login");
  return response;
}
