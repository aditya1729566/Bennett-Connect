import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type MicrosoftSignInButtonProps = {
  errorPath: "/login" | "/signup";
};

function getBaseUrl(headerStore: Headers) {
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

async function signInWithMicrosoft(formData: FormData) {
  "use server";

  const errorPath = String(formData.get("error_path") ?? "/login");
  if (!isSupabaseConfigured) {
    redirect(`${errorPath}?error=Supabase%20is%20not%20configured%20yet.`);
  }

  const headerStore = await headers();
  const baseUrl = getBaseUrl(headerStore);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=/discover`,
      scopes: "email",
    },
  });

  if (error || !data.url) {
    redirect(`${errorPath}?error=${encodeURIComponent(error?.message ?? "Could not start Outlook login.")}`);
  }

  redirect(data.url);
}

export function MicrosoftSignInButton({ errorPath }: MicrosoftSignInButtonProps) {
  return (
    <form action={signInWithMicrosoft}>
      <input type="hidden" name="error_path" value={errorPath} />
      <PendingSubmitButton variant="light" pendingLabel="Opening Outlook..." className="min-h-14 w-full gap-2 border-cyan-200 bg-cyan-50 text-base text-cyan-900 hover:border-cyan-300 hover:bg-cyan-100 sm:min-h-0 sm:text-sm">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#0078d4] text-sm font-black text-white sm:h-5 sm:w-5 sm:rounded sm:text-xs">M</span>
        Continue with Outlook
      </PendingSubmitButton>
    </form>
  );
}
