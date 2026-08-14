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

function SocialIcon({ kind }: { kind: "github" | "linkedin" | "instagram" | "x" | "codeforces" }) {
  if (kind === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M12 .7a11.3 11.3 0 0 0-3.6 22c.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.7 2.5 2.7 1.8.1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.6 0-1.2.4-2.2 1.2-3-.1-.3-.5-1.5.1-3 0 0 .9-.3 3.1 1.1A10.7 10.7 0 0 1 12 6.9c1 0 1.9.1 2.8.4 2.2-1.4 3.1-1.1 3.1-1.1.6 1.5.2 2.7.1 3 .7.8 1.2 1.8 1.2 3 0 4.3-2.7 5.3-5.3 5.6.4.4.8 1.1.8 2.2v3.1c0 .4.2.7.8.6A11.3 11.3 0 0 0 12 .7Z" />
      </svg>
    );
  }

  if (kind === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M20.4 20.4h-3.6v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v5.8H9.1V8.8h3.5v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.7 0 4.3 2.4 4.3 5.5v6.4ZM5.1 7.2a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm1.8 13.2H3.3V8.8h3.6v11.6ZM22.2 0H1.8C.8 0 0 .8 0 1.8v20.4c0 1 .8 1.8 1.8 1.8h20.4c1 0 1.8-.8 1.8-1.8V1.8c0-1-.8-1.8-1.8-1.8Z" />
      </svg>
    );
  }

  if (kind === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M14.3 10.2 22.7 0h-2l-7.3 8.8L7.6 0H.9l8.8 13.1L.9 24h2l7.7-9.4 6.2 9.4h6.7l-9.2-13.8Zm-2.7 3.3-.9-1.3L3.6 1.5h3l5.7 8.6.9 1.3 7.5 11.2h-3l-6.1-9.1Z" />
      </svg>
    );
  }

  return <span aria-hidden="true" className="text-xs font-black tracking-tight">CF</span>;
}

function SocialIconLink({ href, label, kind }: { href: string; label: string; kind: "github" | "linkedin" | "instagram" | "x" | "codeforces" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="pressable inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:border-cyan-300 hover:text-cyan-800"
    >
      <SocialIcon kind={kind} />
    </a>
  );
}

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
  const showLocation = profile.residence_type === "day_scholar" || isOwnProfile || profile.show_room_publicly;
  const profileMeta = [profile.course, profile.year_of_study ?? profile.graduation_year, showLocation ? (profile.residence_type === "day_scholar" ? "Day scholar" : profile.hostel) : null]
    .filter(Boolean)
    .join(" • ");

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
                {profileMeta}
              </p>
              {showLocation && profile.room_no ? (
                <p className="mt-2 inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm font-black text-cyan-800">
                  Room {profile.room_no}
                </p>
              ) : null}
              {isOwnProfile && profile.residence_type === "hostel" && profile.hostel && profile.room_no && !profile.show_room_publicly ? (
                <p className="mt-2 text-xs font-bold text-zinc-500">Your hostel and room are hidden from other students.</p>
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

          {profile.github_url || profile.linkedin_url || profile.instagram_url || profile.x_url || profile.codeforces_handle ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {profile.github_url ? <SocialIconLink href={profile.github_url} label="Open GitHub profile" kind="github" /> : null}
              {profile.linkedin_url ? <SocialIconLink href={profile.linkedin_url} label="Open LinkedIn profile" kind="linkedin" /> : null}
              {profile.instagram_url ? <SocialIconLink href={profile.instagram_url} label="Open Instagram profile" kind="instagram" /> : null}
              {profile.x_url ? <SocialIconLink href={profile.x_url} label="Open X profile" kind="x" /> : null}
              {profile.codeforces_handle ? <SocialIconLink href={`https://codeforces.com/profile/${profile.codeforces_handle}`} label="Open Codeforces profile" kind="codeforces" /> : null}
            </div>
          ) : null}

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
