import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { getProfileById } from "@/lib/data/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

async function logout() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function deleteAccount() {
  "use server";

  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.signOut();
  redirect("/");
}

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const profile = await getProfileById(supabase, user.id);

  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Settings</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">Account</h1>
        </div>
        <div className="mt-6">
          <SetupNotice />
        </div>

        <section className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5">
          <h2 className="text-xl font-black text-zinc-950">Profile</h2>
          <p className="mt-2 text-sm text-zinc-600">{profile ? `${profile.full_name} • @${profile.username}` : user.email}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-black">
              Edit profile
            </Link>
            {profile ? (
              <Link href={`/profile/${profile.username}`} className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-black">
                View profile
              </Link>
            ) : null}
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-black text-zinc-950">Session</h2>
          <form action={logout} className="mt-4">
            <PendingSubmitButton pendingLabel="Logging out...">Log out</PendingSubmitButton>
          </form>
        </section>

        <section className="mt-5 rounded-lg border border-red-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-black text-red-700">Delete account</h2>
          <form action={deleteAccount} className="mt-4">
            <PendingSubmitButton variant="danger" pendingLabel="Deleting...">
              Delete account
            </PendingSubmitButton>
          </form>
        </section>
      </main>
    </PageShell>
  );
}
