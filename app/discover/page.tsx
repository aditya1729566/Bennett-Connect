import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfileCard } from "@/components/ProfileCard";
import { SetupNotice } from "@/components/SetupNotice";
import { getAllProfiles, getExcludedRecommendationIds, getProfileById } from "@/lib/data/profiles";
import { getRecommendations } from "@/lib/matching/getRecommendations";
import { notifyUser } from "@/lib/notifications/push";
import { createClient, requireUser } from "@/lib/supabase/server";

async function connect(formData: FormData) {
  "use server";

  const user = await requireUser();
  const receiverId = String(formData.get("receiver_id") ?? "");
  const supabase = await createClient();

  if (!receiverId || receiverId === user.id) {
    redirect("/discover?error=Choose%20another%20student%20to%20connect%20with.");
  }

  const { error } = await supabase.from("connection_requests").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    status: "pending",
  });

  if (error && error.code !== "23505") {
    redirect(`/discover?error=${encodeURIComponent(error.message)}`);
  }

  if (!error) {
    const senderProfile = await getProfileById(supabase, user.id);
    await notifyUser(receiverId, {
      title: "New connection invite",
      body: `${senderProfile?.full_name ?? "Someone"} wants to connect with you on Bennett Connect.`,
      url: "/connections",
    });
  }

  revalidatePath("/discover");
  redirect("/discover?connected=1");
}

async function skip(formData: FormData) {
  "use server";

  const user = await requireUser();
  const skippedUserId = String(formData.get("skipped_user_id") ?? "");
  const supabase = await createClient();

  if (!skippedUserId || skippedUserId === user.id) {
    redirect("/discover?error=Choose%20another%20student%20to%20skip.");
  }

  const { error } = await supabase.from("profile_skips").upsert({ user_id: user.id, skipped_user_id: skippedUserId }, { onConflict: "user_id,skipped_user_id" });

  if (error) {
    redirect(`/discover?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/discover");
  redirect("/discover?skipped=1");
}

export default async function DiscoverPage({ searchParams }: { searchParams?: Promise<{ connected?: string; skipped?: string; error?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();
  const currentProfile = await getProfileById(supabase, user.id);

  if (!currentProfile) {
    redirect("/onboarding");
  }

  const [profiles, excluded] = await Promise.all([getAllProfiles(supabase), getExcludedRecommendationIds(supabase, user.id)]);
  const recommendations = getRecommendations(currentProfile, profiles, excluded).slice(0, 24);

  return (
    <PageShell>
      <main className="mx-auto grid max-w-6xl gap-5 px-3 py-5 sm:px-4 sm:py-8 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Discover people</p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl lg:text-3xl">The students worth meeting next.</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Sorted by shared interests, goals, skills, course, year, and hostel.</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-lg font-black text-zinc-950">{recommendations.length}</p>
                <p className="text-[11px] font-bold text-zinc-500">matches</p>
              </div>
              <div className="rounded-lg bg-cyan-50 p-3">
                <p className="text-lg font-black text-cyan-800">{currentProfile.interests.length}</p>
                <p className="text-[11px] font-bold text-cyan-700">interests</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-lg font-black text-emerald-800">{currentProfile.goals.length}</p>
                <p className="text-[11px] font-bold text-emerald-700">goals</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Your signals</p>
              <div className="signal-strip -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                {[...currentProfile.interests.slice(0, 4).map((interest) => interest.name), ...currentProfile.goals.slice(0, 3).map((goal) => goal.title)].map((signal) => (
                  <span key={signal} className="shrink-0 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <SetupNotice />
          </div>
        </aside>

        <section className="space-y-3 sm:space-y-4">
          {params?.connected ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Connection request sent.</p> : null}
          {params?.skipped ? <p className="rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-cyan-800">Skipped. The next recommendation is ready.</p> : null}
          {params?.error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}
          {recommendations.length > 0
            ? recommendations.map((recommendation) => (
                <ProfileCard
                  key={recommendation.profile.id}
                  recommendation={recommendation}
                  actions={
                    <>
                      <form action={skip} className="flex-1">
                        <input type="hidden" name="skipped_user_id" value={recommendation.profile.id} />
                        <PendingSubmitButton variant="light" pendingLabel="Skipping..." className="w-full">
                          Skip
                        </PendingSubmitButton>
                      </form>
                      <form action={connect} className="flex-1">
                        <input type="hidden" name="receiver_id" value={recommendation.profile.id} />
                        <PendingSubmitButton pendingLabel="Sending..." className="w-full">
                          Connect
                        </PendingSubmitButton>
                      </form>
                    </>
                  }
                />
              ))
            : (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
                  <h2 className="text-2xl font-black text-zinc-950">No recommendations yet</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">Once more students finish profiles, your best matches will show up here.</p>
                </div>
              )}
        </section>
      </main>
    </PageShell>
  );
}
