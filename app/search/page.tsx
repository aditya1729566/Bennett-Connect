import { PageShell } from "@/components/PageShell";
import { ProfileCard } from "@/components/ProfileCard";
import { getAllProfiles, getProfileById } from "@/lib/data/profiles";
import { calculateMatch } from "@/lib/matching/calculateMatch";
import { createClient, requireUser } from "@/lib/supabase/server";

function matchesQuery(profileText: string, query: string) {
  return profileText.toLowerCase().includes(query.toLowerCase());
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const supabase = await createClient();
  const [currentProfile, profiles] = query ? await Promise.all([getProfileById(supabase, user.id), getAllProfiles(supabase)]) : [null, []];

  const results =
    query && currentProfile
      ? profiles
          .filter((profile) => profile.id !== user.id)
          .filter((profile) =>
            matchesQuery(
              [
                profile.full_name,
                profile.username,
                profile.course,
                profile.interests.map((interest) => interest.name).join(" "),
                profile.goals.map((goal) => goal.title).join(" "),
                profile.skills.map((skill) => skill.name).join(" "),
              ]
                .filter(Boolean)
                .join(" "),
              query,
            ),
          )
          .map((profile) => calculateMatch(currentProfile, profile))
          .sort((a, b) => b.score - a.score)
          .slice(0, 24)
      : [];

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="motion-rise mb-5 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Search</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">Find by signal.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Search names, interests, goals, skills, or course. Discovery still does the heavy lifting.</p>
        </div>

        <form className="motion-rise rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur">
          <label className="block text-sm font-bold text-zinc-700">
            Search campus
            <input name="q" defaultValue={query} placeholder="Competitive Programming, CSE, chess..." className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
          </label>
        </form>

        <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
          {query ? (
            results.length > 0 ? (
              results.map((recommendation) => <ProfileCard key={recommendation.profile.id} recommendation={recommendation} />)
            ) : (
              <div className="motion-rise rounded-lg border border-zinc-200 bg-white/92 p-6 text-center shadow-sm backdrop-blur">
                <h2 className="text-2xl font-black text-zinc-950">No matches</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Try a broader interest, goal, skill, or course.</p>
              </div>
            )
          ) : (
            <div className="motion-rise rounded-lg border border-zinc-200 bg-white/92 p-6 text-center shadow-sm backdrop-blur">
              <h2 className="text-2xl font-black text-zinc-950">Search when you need something specific</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Examples: hackathon, football, Codeforces, AI / ML, CSE.</p>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
