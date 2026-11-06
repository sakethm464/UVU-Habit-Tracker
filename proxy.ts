// Next 16 "proxy" (formerly middleware): refresh the Supabase session + guard routes.
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|service-worker.js|manifest.json|offline.html|icons/|api/beams|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
