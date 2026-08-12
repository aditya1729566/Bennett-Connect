import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { createAdminClient, createClient, getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function login(formData: FormData) {
  "use server";

  if (!isSupabaseConfigured) {
    redirect("/login?error=Supabase%20is%20not%20configured%20yet.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
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
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-10">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Welcome back</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">Log in</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Open your campus discovery list and connection requests.</p>
          <div className="mt-5">
            <SetupNotice />
          </div>
          {params?.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}
          <form action={login} className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-zinc-700">
              Email
              <input name="email" type="email" required className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Password
              <input name="password" type="password" required className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <PendingSubmitButton pendingLabel="Opening campus..." className="w-full">
              Log in
            </PendingSubmitButton>
          </form>
          <div className="mt-5 flex items-center justify-between text-sm font-semibold text-zinc-600">
            <Link href="/signup">Create account</Link>
            <Link href="/reset-password">Reset password</Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
