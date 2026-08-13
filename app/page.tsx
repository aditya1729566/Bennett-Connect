import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { getProfileByUsername } from "@/lib/data/profiles";
import { createAdminClient, createClient, getUser } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

const FEATURED_USERNAME = "anarchistgovernor";
const FEATURED_WEBSITE = "https://personal-website-bay-omega.vercel.app";
const FALLBACK_FEATURED_PROFILE = {
  full_name: "Aditya Agrawal",
  avatar_url: null,
  course: "CSE",
  year_of_study: "First Year",
  graduation_year: 2030,
  bio: "I am not here to fit into the campus. I am here to build the thing everyone talks about next.",
  github_url: "https://github.com/aditya1729566",
  linkedin_url: "https://www.linkedin.com/in/aditya-agrawal-367337288/",
};

async function getFeaturedProfile() {
  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : await createClient();
    return await Promise.race([
      getProfileByUsername(supabase, FEATURED_USERNAME),
      new Promise<Profile | null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
  } catch {
    return null;
  }
}

export default async function Home() {
  const user = await getUser();
  const featuredProfile = await getFeaturedProfile();
  const previewName = featuredProfile?.full_name ?? FALLBACK_FEATURED_PROFILE.full_name;
  const previewMeta = [featuredProfile?.course ?? FALLBACK_FEATURED_PROFILE.course, featuredProfile?.year_of_study ?? featuredProfile?.graduation_year ?? FALLBACK_FEATURED_PROFILE.year_of_study]
    .filter(Boolean)
    .join(" • ");
  const previewBio =
    featuredProfile?.bio?.replace(`to know more about me go to - ${FEATURED_WEBSITE}`, FALLBACK_FEATURED_PROFILE.bio) ??
    FALLBACK_FEATURED_PROFILE.bio;
  const previewTags =
    featuredProfile && (featuredProfile.interests.length > 0 || featuredProfile.goals.length > 0 || featuredProfile.skills.length > 0)
      ? [
          ...featuredProfile.interests.slice(0, 2).map((interest) => interest.name),
          ...featuredProfile.goals.slice(0, 2).map((goal) => goal.title),
          ...featuredProfile.skills.slice(0, 1).map((skill) => skill.name),
        ]
      : ["Web Development", "Codeforces", "Campus products"];
  const profileHref = `/profile/${FEATURED_USERNAME}`;

  return (
    <PageShell>
      <main className="mx-auto grid min-h-[calc(100vh-56px)] max-w-6xl items-center gap-6 px-3 py-6 sm:px-4 sm:py-10 md:min-h-[calc(100vh-64px)] md:grid-cols-[1fr_0.9fr] md:gap-10 md:py-16">
        <section>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Bennett Connect</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.04] text-zinc-950 sm:text-6xl">
            Find the people on campus you should know.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700 sm:mt-5 sm:text-lg sm:leading-8">
            Meet students who share your interests, goals, skills, and ambitions. Start with the 10 people who are most useful to know, not an endless feed.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <Link href={user ? "/discover" : "/signup"} className="pressable rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-zinc-800">
              {user ? "Open Discover" : "Join your campus"}
            </Link>
            <Link href={profileHref} className="pressable rounded-full border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-black text-zinc-900 shadow-sm hover:border-zinc-400">
              Meet Aditya
            </Link>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-zinc-700 sm:mt-10 sm:grid-cols-3">
            <div className="interactive-card rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="font-black text-zinc-950">Discovery first</p>
              <p className="mt-1">Recommendations explain why someone is worth meeting.</p>
            </div>
            <div className="interactive-card rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="font-black text-zinc-950">Campus trust</p>
              <p className="mt-1">Built around verified university profiles and privacy.</p>
            </div>
            <div className="interactive-card rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="font-black text-zinc-950">Useful requests</p>
              <p className="mt-1">Find teammates, practice partners, builders, and collaborators.</p>
            </div>
          </div>
        </section>

        <div className="interactive-card rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="relative flex min-h-[34rem] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-white via-cyan-50/70 to-emerald-50/80 p-5 text-zinc-950 sm:min-h-[36rem]">
            <div className="absolute inset-x-5 top-16 h-px bg-zinc-200/80" />
            <div className="absolute inset-y-5 left-16 w-px bg-zinc-200/80" />
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-cyan-200 bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-800">Featured profile</span>
              <span className="text-xs font-semibold text-zinc-500">Discover</span>
            </div>
            <div className="mt-14 sm:mt-20">
              <ProfileAvatar src={featuredProfile?.avatar_url ?? FALLBACK_FEATURED_PROFILE.avatar_url} name={previewName} size="lg" />
            </div>
            <h2 className="mt-6 text-2xl font-black sm:text-3xl">{previewName}</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-600">{previewMeta}</p>
            <p className="mt-4 text-base leading-7 text-zinc-700">{previewBio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={FEATURED_WEBSITE} target="_blank" rel="noreferrer" className="pressable rounded-full bg-zinc-950 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-zinc-800">
                Visit website
              </a>
              <Link href={profileHref} className="pressable rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-black text-zinc-900 shadow-sm hover:border-zinc-400">
                Open profile
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {previewTags.slice(0, 5).map((item) => (
                <span key={item} className="rounded-full border border-zinc-200 bg-white/75 px-3 py-1 text-xs font-bold text-zinc-800">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm">
              <p className="text-xs font-black uppercase text-zinc-500">Why</p>
              <p className="mt-2 text-sm leading-6">This is a real Bennett Connect profile. Students can open it, see the campus signal, and connect after joining.</p>
            </div>
            <div className="relative mt-auto flex justify-end pt-5">
              <Link href={profileHref} className="pressable rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-lg hover:bg-emerald-600">
                View profile
              </Link>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
