import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { goalOptions, interestOptions, yearOptions } from "@/lib/data/options";
import { slugify } from "@/lib/data/slug";
import { requireUser } from "@/lib/supabase/server";

export default async function OnboardingPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const currentYear = new Date().getFullYear();

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="mb-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Two-minute profile</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">Help the right people find you.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Pick enough signal for useful recommendations. You can change this later.</p>
        </div>

        <SetupNotice />
        {params?.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}

        <form action="/api/onboarding" method="post" className="mt-5 space-y-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5">
          <section className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-zinc-700">
              Full name
              <input name="full_name" required defaultValue={user.user_metadata?.full_name ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Username
              <input name="username" placeholder="arjunsharma" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Course / branch
              <input name="course" required placeholder="CSE" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Graduation year
              <input name="graduation_year" type="number" min={currentYear} max={currentYear + 8} required defaultValue={currentYear + 4} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Year of study
              <select name="year_of_study" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600">
                <option value="">Choose year</option>
                {yearOptions.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Hostel
              <input name="hostel" required placeholder="Required - enter your hostel name" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Room no.
              <input name="room_no" required placeholder="Required - enter your exact room no." className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
          </section>

          <section>
            <h2 className="text-base font-black text-zinc-950 sm:text-lg">What are you into?</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <label key={interest} className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700 has-checked:border-cyan-500 has-checked:bg-cyan-50 has-checked:text-cyan-800">
                  <input type="checkbox" name="interests" value={slugify(interest)} className="sr-only" />
                  {interest}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-black text-zinc-950 sm:text-lg">What are you trying to do right now?</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {goalOptions.map((goal) => (
                <label key={goal} className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700 has-checked:border-emerald-500 has-checked:bg-emerald-50 has-checked:text-emerald-800">
                  <input type="checkbox" name="goals" value={slugify(goal)} className="sr-only" />
                  {goal}
                </label>
              ))}
            </div>
            <input name="custom_goal" placeholder="Add a goal if yours is missing" className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-bold text-zinc-700 sm:col-span-3">
              Bio
              <textarea name="bio" rows={4} placeholder="Tell people what you're working on." className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              GitHub
              <input name="github_url" placeholder="https://github.com/..." className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              LinkedIn
              <input name="linkedin_url" placeholder="https://linkedin.com/in/..." className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Codeforces
              <input name="codeforces_handle" placeholder="handle" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
          </section>

          <PendingSubmitButton pendingLabel="Building your matches..." className="w-full">
            Start discovering
          </PendingSubmitButton>
        </form>
      </main>
    </PageShell>
  );
}
