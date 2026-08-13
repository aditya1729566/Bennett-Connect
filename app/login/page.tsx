import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { MicrosoftSignInButton } from "@/components/MicrosoftSignInButton";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { createAdminClient, createClient, getUser } from "@/lib/supabase/server";
import { allowedEmailDomains, isAllowedCampusEmail, isSupabaseConfigured } from "@/lib/supabase/config";

async function login(formData: FormData) {
  "use server";

  if (!isSupabaseConfigured) {
    redirect("/login?error=Supabase%20is%20not%20configured%20yet.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isAllowedCampusEmail(email)) {
    redirect(`/login?error=${encodeURIComponent(`Use your Bennett email. Allowed domains: ${allowedEmailDomains.join(", ")}`)}`);
  }

  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error?.message.toLowerCase().includes("email not confirmed")) {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = data.users.find((user) => user.email?.toLowerCase() === email);

    if (existingUser) {
      const confirmed = await admin.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
      if (!confirmed.error) {
        const retried = await supabase.auth.signInWithPassword({ email, password });
        error = retried.error;
      }
    }
  }

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/discover");
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (user) {
    redirect("/discover");
  }

  const params = await searchParams;

  return (
    <PageShell>
      <main className="mx-auto grid min-h-[calc(100svh-56px)] w-full max-w-6xl px-0 sm:min-h-[calc(100vh-64px)] sm:px-4 sm:py-10 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-10">
        <section className="hidden lg:block">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Bennett Connect</p>
          <h1 className="mt-3 max-w-xl text-5xl font-black leading-tight text-zinc-950">Your campus network, one Outlook tap away.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-700">Use your Bennett Microsoft account to get back to discovery, requests, connections, and chats without fighting another password box.</p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm text-zinc-700">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-black text-zinc-950">1</p>
              <p className="mt-1 font-bold">Outlook sign-in</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-black text-zinc-950">2</p>
              <p className="mt-1 font-bold">Campus profile</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-black text-zinc-950">3</p>
              <p className="mt-1 font-bold">Useful people</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[calc(100svh-56px)] flex-col bg-white px-5 py-6 sm:min-h-0 sm:rounded-2xl sm:border sm:border-zinc-200 sm:p-6 sm:shadow-sm">
          <div className="sm:hidden">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Bennett Connect</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-zinc-950">Welcome back.</h1>
            <p className="mt-3 text-base leading-7 text-zinc-600">Continue with your Bennett Outlook account and jump straight into campus discovery.</p>
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Welcome back</p>
            <h1 className="mt-2 text-3xl font-black text-zinc-950">Log in</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">Open your campus discovery list and connection requests.</p>
          </div>

          <div className="mt-5">
            <SetupNotice />
          </div>
          {params?.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}
          <div className="mt-6">
            <MicrosoftSignInButton errorPath="/login" />
          </div>
          <div className="my-6 flex items-center gap-3 sm:my-5">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-black uppercase tracking-wide text-zinc-400">or use password</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>
          <form action={login} className="space-y-4">
            <label className="block text-sm font-bold text-zinc-700">
              Email
              <input name="email" type="email" required maxLength={254} placeholder="name@bennett.edu.in" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Password
              <input name="password" type="password" required className="mt-2 min-h-12 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <PendingSubmitButton pendingLabel="Opening campus..." className="min-h-14 w-full text-base sm:min-h-0 sm:text-sm">
              Log in
            </PendingSubmitButton>
          </form>
          <div className="mt-auto flex items-center justify-between pt-8 text-sm font-semibold text-zinc-600 sm:mt-5 sm:pt-0">
            <Link href="/signup">Create account</Link>
            <Link href="/reset-password">Reset password</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
