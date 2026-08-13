import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { allowedEmailDomains, isAllowedCampusEmail, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function resetPassword(formData: FormData) {
  "use server";

  if (!isSupabaseConfigured) {
    redirect("/reset-password?message=Supabase%20is%20not%20configured%20yet.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isAllowedCampusEmail(email)) {
    redirect(`/reset-password?message=${encodeURIComponent(`Use your Bennett email. Allowed domains: ${allowedEmailDomains.join(", ")}`)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    redirect(`/reset-password?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/reset-password?message=Check%20your%20email%20for%20the%20reset%20link.");
}

export default async function ResetPasswordPage({ searchParams }: { searchParams?: Promise<{ message?: string }> }) {
  const params = await searchParams;

  return (
    <PageShell>
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-10">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-zinc-950">Reset password</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Send a password reset link to your Bennett campus email.</p>
          <div className="mt-5">
            <SetupNotice />
          </div>
          {params?.message ? <p className="mt-4 rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-cyan-800">{params.message}</p> : null}
          <form action={resetPassword} className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-zinc-700">
              Email
              <input name="email" type="email" required maxLength={254} placeholder="name@bennett.edu.in" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <PendingSubmitButton pendingLabel="Sending..." className="w-full">
              Send reset link
            </PendingSubmitButton>
          </form>
          <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-zinc-600">
            Back to login
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
