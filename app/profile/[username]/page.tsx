import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { InterestBadge } from "@/components/InterestBadge";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { getProfileById, getProfileByUsername } from "@/lib/data/profiles";
import { notifyUser } from "@/lib/notifications/push";
import { createAdminClient, createClient, getUser, requireUser } from "@/lib/supabase/server";

async function connect(formData: FormData) {
  "use server";

  const user = await requireUser();
  const receiverId = String(formData.get("receiver_id") ?? "");
  const username = String(formData.get("username") ?? "");
  const supabase = await createClient();

  if (!receiverId || receiverId === user.id) {
    redirect(`/profile/${username}?error=Choose%20another%20student%20to%20connect%20with.`);
  }

  const { error } = await supabase.from("connection_requests").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    status: "pending",
  });

  if (error && error.code !== "23505") {
    redirect(`/profile/${username}?error=${encodeURIComponent(error.message)}`);
  }

  if (!error) {
    const senderProfile = await getProfileById(supabase, user.id);
    await notifyUser(receiverId, {
      title: "New connection invite",
      body: `${senderProfile?.full_name ?? "Someone"} wants to connect with you on Bennett Connect.`,
      url: "/connections",
    });
  }

  redirect(`/profile/${username}?connected=1`);
}

async function block(formData: FormData) {
  "use server";

  const user = await requireUser();
  const receiverId = String(formData.get("receiver_id") ?? "");
  const username = String(formData.get("username") ?? "");
  const supabase = await createClient();

  if (receiverId && receiverId !== user.id) {
    const { count } = await supabase
      .from("connection_requests")
      .update({ status: "blocked" }, { count: "exact" })
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`);

    if (!count) {
      const { error } = await supabase.from("connection_requests").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: "blocked",
      });

      if (error) {
        redirect(`/profile/${username}?error=${encodeURIComponent(error.message)}`);
      }
    }
  }

  revalidatePath("/discover");
  redirect(`/profile/${username}?blocked=1`);
}

async function reportProfile(formData: FormData) {
  "use server";

  const user = await requireUser();
  const reportedUserId = String(formData.get("reported_user_id") ?? "");
  const username = String(formData.get("username") ?? "");
  const reason = String(formData.get("reason") ?? "other");
  const details = String(formData.get("details") ?? "").trim() || null;
  const supabase = await createClient();

  if (reportedUserId && reportedUserId !== user.id) {
    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      reason,
      details,
    });
  }

  redirect(`/profile/${username}?reported=1`);
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ reported?: string; connected?: string; blocked?: string; error?: string }>;
}) {
  const { username } = await params;
  const query = await searchParams;
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : await createClient();
  const [profile, user] = await Promise.all([getProfileByUsername(supabase, username), getUser()]);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = profile.id === user?.id;

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        {query?.reported ? <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Report received. Thank you for keeping campus safe.</p> : null}
        {query?.connected ? <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Connection request sent.</p> : null}
        {query?.blocked ? <p className="mb-4 rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-cyan-800">Profile blocked. They will not appear in discovery.</p> : null}
        {query?.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{query.error}</p> : null}

        <section className="motion-rise rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <ProfileAvatar src={profile.avatar_url} name={profile.full_name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">{profile.university_name ?? "Campus profile"}</p>
              <h1 className="mt-2 break-words text-3xl font-black leading-tight text-zinc-950 sm:text-4xl">{profile.full_name}</h1>
              <p className="mt-2 text-sm font-semibold text-zinc-500">@{profile.username}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-700 sm:text-base">
                {[profile.course, profile.year_of_study ?? profile.graduation_year, profile.residence_type === "day_scholar" ? "Day scholar" : profile.hostel].filter(Boolean).join(" • ")}
              </p>
              {profile.room_no ? (
                <p className="mt-2 inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm font-black text-cyan-800">
                  Room {profile.room_no}
                </p>
              ) : null}
              {profile.bio ? <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700 sm:text-base">{profile.bio}</p> : null}
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-zinc-500">Interests</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests.length > 0 ? profile.interests.map((interest) => <InterestBadge key={interest.id}>{interest.name}</InterestBadge>) : <p className="text-sm text-zinc-500">No interests added yet.</p>}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-zinc-500">Goals</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.goals.length > 0 ? profile.goals.map((goal) => <InterestBadge key={goal.id} tone="goal">{goal.title}</InterestBadge>) : <p className="text-sm text-zinc-500">No goals added yet.</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
            {profile.github_url ? <Link href={profile.github_url} className="rounded-full border border-zinc-300 px-4 py-2">GitHub</Link> : null}
            {profile.linkedin_url ? <Link href={profile.linkedin_url} className="rounded-full border border-zinc-300 px-4 py-2">LinkedIn</Link> : null}
            {profile.codeforces_handle ? <span className="rounded-full border border-zinc-300 px-4 py-2">Codeforces: {profile.codeforces_handle}</span> : null}
          </div>

          {!user ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/signup" className="pressable rounded-full bg-zinc-950 px-5 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-zinc-800">
                Join to connect
              </Link>
              <Link href="/login" className="pressable rounded-full border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-black text-zinc-900 shadow-sm hover:border-zinc-400">
                Log in
              </Link>
            </div>
          ) : !isOwnProfile ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <form action={connect}>
                <input type="hidden" name="receiver_id" value={profile.id} />
                <input type="hidden" name="username" value={profile.username} />
                <PendingSubmitButton pendingLabel="Sending..." className="w-full">
                  Connect
                </PendingSubmitButton>
              </form>
              <form action={block}>
                <input type="hidden" name="receiver_id" value={profile.id} />
                <input type="hidden" name="username" value={profile.username} />
                <PendingSubmitButton variant="light" pendingLabel="Blocking..." className="w-full">
                  Block
                </PendingSubmitButton>
              </form>
            </div>
          ) : null}
        </section>

        {user && !isOwnProfile ? (
          <form action={reportProfile} className="motion-rise mt-5 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:p-5">
            <h2 className="text-lg font-black text-zinc-950">Report profile</h2>
            <input type="hidden" name="reported_user_id" value={profile.id} />
            <input type="hidden" name="username" value={profile.username} />
            <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
              <select name="reason" className="rounded-lg border border-zinc-300 px-3 py-3 text-sm font-semibold">
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="impersonation">Impersonation</option>
                <option value="inappropriate">Inappropriate</option>
                <option value="scam">Scam</option>
                <option value="other">Other</option>
              </select>
              <input name="details" placeholder="Optional details" className="rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
              <PendingSubmitButton variant="light" pendingLabel="Reporting...">
                Report
              </PendingSubmitButton>
            </div>
          </form>
        ) : null}
      </main>
    </PageShell>
  );
}
