import { NextResponse, type NextRequest } from "next/server";
import { allowedEmailDomains, isAllowedCampusEmail } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  return value?.startsWith("/") ? value : "/discover";
}

function redirectUrl(request: NextRequest, path: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin;
  return new URL(path, origin);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(redirectUrl(request, "/login?error=Outlook%20login%20was%20cancelled."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(redirectUrl(request, `/login?error=${encodeURIComponent(error.message)}`));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  if (!isAllowedCampusEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      redirectUrl(request, `/login?error=${encodeURIComponent(`Use your Bennett Outlook email. Allowed domains: ${allowedEmailDomains.join(", ")}`)}`),
    );
  }

  return NextResponse.redirect(redirectUrl(request, next));
}
