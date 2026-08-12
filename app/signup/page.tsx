import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { allowedEmailDomains, isAllowedCampusEmail, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient, createClient, getUser } from "@/lib/supabase/server";

async function signup(formData: FormData) {
  "use server";

  if (!isSupabaseConfigured || !isSupabaseAdminConfigured) {
    redirect("/signup?error=Supabase%20is%20not%20configured%20yet.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isAllowedCampusEmail(email)) {
    redirect(`/signup?error=${encodeURIComponent(`Use an approved campus email domain: ${allowedEmailDomains.join(", ")}`)}`);
  }

  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.error) {
    const message = created.error.message.includes("already been registered")
      ? "This email is already registered. Log in instead."
      : created.error.message;
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();
  const signedIn = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signedIn.error) {
    redirect(`/login?error=${encodeURIComponent("Account created. Please log in with your password.")}`);
  }

  redirect("/onboarding");
}

export default async function SignupPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (user) {
    redirect("/discover");
  }

  const params = await searchParams;

  return (
    <PageShell>
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-10">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Campus beta</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">Join your campus</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Create an account with your university email and finish your profile in under two minutes.</p>
          <div className="mt-5">
            <SetupNotice />
          </div>
          {params?.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}
          <form action={signup} className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-zinc-700">
              University email
              <input name="email" type="email" required className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Password
              <input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <PendingSubmitButton pendingLabel="Creating account..." className="w-full">
              Create account
            </PendingSubmitButton>
          </form>
          <p className="mt-5 text-center text-sm font-semibold text-zinc-600">
            Already joined? <Link href="/login">Log in</Link>
          </p>
        </div>
      </main>
    </PageShell>
  );
}
