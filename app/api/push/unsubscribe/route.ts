import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireUser();
  const payload = (await request.json().catch(() => ({}))) as { endpoint?: string };

  if (!payload.endpoint) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", payload.endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
