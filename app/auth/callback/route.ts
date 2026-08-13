import { NextResponse, type NextRequest } from "next/server";
import { withTimeoutFallback } from "@/lib/async/withTimeout";
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
  const { error } = await withTimeoutFallback(supabase.auth.exchangeCodeForSession(code), 5000, "Outlook session exchange", {
    error: new Error("Outlook sign-in took too long. Please try again."),
  });

  if (error) {
    const message =
      error.message.toLowerCase().includes("fetch") || error.message.toLowerCase().includes("dns")
        ? "Outlook sign-in could not finish. Please check your connection and try again."
        : error.message;
    return NextResponse.redirect(redirectUrl(request, `/login?error=${encodeURIComponent(message)}`));
  }

  const {
    data: { user },
  } = await withTimeoutFallback(supabase.auth.getUser(), 2500, "Outlook callback user lookup", { data: { user: null }, error: null });
  const email = user?.email ?? "";

  if (!isAllowedCampusEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      redirectUrl(request, `/login?error=${encodeURIComponent(`Use your Bennett Outlook email. Allowed domains: ${allowedEmailDomains.join(", ")}`)}`),
    );
  }

  return NextResponse.redirect(redirectUrl(request, next));
}
