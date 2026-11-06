import { NextResponse, type NextRequest } from "next/server";
import PushNotifications from "@pusher/push-notifications-server";
import { createClient } from "@/lib/supabase/server";

// Issues a Pusher Beams user token so a device can subscribe by user_id (Authenticated Users mode).
// The Beams client calls GET /api/beams/auth?user_id=<id> (with cookies); we only sign for the
// signed-in user, never for an arbitrary id.
export async function GET(request: NextRequest) {
  const instanceId = process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID;
  const secretKey = process.env.BEAMS_SECRET_KEY;
  if (!instanceId || !secretKey) {
    return NextResponse.json({ error: "Beams is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const requested = request.nextUrl.searchParams.get("user_id");
  if (requested !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const beams = new PushNotifications({ instanceId, secretKey });
  return NextResponse.json(beams.generateToken(user.id), { headers: { "Cache-Control": "no-store" } });
}
