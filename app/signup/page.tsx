import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { MicrosoftSignInButton } from "@/components/MicrosoftSignInButton";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { allowedEmailDomains, isAllowedCampusEmail, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getUser } from "@/lib/supabase/server";

async function getBaseUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

async function signup(formData: FormData) {
  "use server";

  if (!isSupabaseConfigured) {
    redirect("/signup?error=Supabase%20is%20not%20configured%20yet.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isAllowedCampusEmail(email)) {
    redirect(`/signup?error=${encodeURIComponent(`Use an approved campus email domain: ${allowedEmailDomains.join(", ")}`)}`);
  }

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const created = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/login`,
    },
  });

  if (created.error) {
    const message = created.error.message.includes("already registered")
      ? "This email is already registered. Log in instead."
      : created.error.message;
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  redirect(`/login?error=${encodeURIComponent("Check your Bennett email and confirm your account before logging in.")}`);
}

export default async function SignupPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (user) {
    redirect("/discover");
  }

  const params = await searchParams;

  return (
    <PageShell>
      <main className="mx-auto grid min-h-[calc(100svh-56px)] w-full max-w-6xl px-0 sm:min-h-[calc(100vh-64px)] sm:px-4 sm:py-10 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-10">
        <section className="motion-rise hidden lg:block">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Bennett Connect</p>
          <h1 className="mt-3 max-w-xl text-5xl font-black leading-tight text-zinc-950">Find the students you should know before everyone else does.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-700">Start with Outlook, finish a quick profile, and let Bennett Connect recommend people around your goals, skills, and interests.</p>
          <div className="interactive-card mt-8 max-w-xl rounded-2xl border border-zinc-200 bg-white/92 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Mobile-first setup</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm font-bold text-zinc-700">
              <span className="rounded-xl bg-cyan-50 p-3 text-cyan-800">Outlook</span>
              <span className="rounded-xl bg-emerald-50 p-3 text-emerald-800">Profile</span>
              <span className="rounded-xl bg-orange-50 p-3 text-orange-800">Discover</span>
            </div>
          </div>
        </section>

        <section className="motion-rise flex min-h-[calc(100svh-56px)] flex-col bg-white/92 px-5 py-6 backdrop-blur sm:min-h-0 sm:rounded-2xl sm:border sm:border-zinc-200 sm:p-6 sm:shadow-sm">
          <div className="sm:hidden">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Bennett Connect</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-zinc-950">Join campus.</h1>
            <p className="mt-3 text-base leading-7 text-zinc-600">Use your Bennett Outlook account and finish your profile in under two minutes.</p>
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Bennett Connect</p>
            <h1 className="mt-2 text-3xl font-black text-zinc-950">Join your campus</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">Create an account with your university email and finish your profile in under two minutes.</p>
          </div>

          <div className="mt-5">
            <SetupNotice />
          </div>
          {params?.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}
          <div className="mt-6">
            <MicrosoftSignInButton errorPath="/signup" />
          </div>
          <div className="my-6 flex items-center gap-3 sm:my-5">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-black uppercase tracking-wide text-zinc-400">or create password</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>
          <form action={signup} className="space-y-4">
            <label className="block text-sm font-bold text-zinc-700">
              University email
              <input name="email" type="email" required maxLength={254} placeholder="name@bennett.edu.in" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Password
              <input name="password" type="password" minLength={8} required className="mt-2 min-h-12 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <PendingSubmitButton pendingLabel="Creating account..." className="min-h-14 w-full text-base sm:min-h-0 sm:text-sm">
              Create account
            </PendingSubmitButton>
          </form>
          <p className="mt-auto pt-8 text-center text-sm font-semibold text-zinc-600 sm:mt-5 sm:pt-0">
            Already joined? <Link href="/login">Log in</Link>
          </p>
        </section>
      </main>
    </PageShell>
  );
}
