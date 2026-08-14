import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { courseOptionGroups, goalOptions, hostelOptions, interestOptions, yearOptions } from "@/lib/data/options";
import { getProfileById } from "@/lib/data/profiles";
import { slugify } from "@/lib/data/slug";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function OnboardingPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const supabase = await createClient();
  const profile = await getProfileById(supabase, user.id);
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const selectedInterestSlugs = new Set(profile?.interests.map((interest) => interest.slug) ?? []);
  const selectedGoalSlugs = new Set(profile?.goals.map((goal) => goal.slug) ?? []);
  const extraInterests = profile?.interests.filter((interest) => !interestOptions.some((option) => slugify(option) === interest.slug)) ?? [];
  const extraGoals = profile?.goals.filter((goal) => !goalOptions.some((option) => slugify(option) === goal.slug)) ?? [];
  const isEditing = Boolean(profile);

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="motion-rise mb-5 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">{isEditing ? "Edit profile" : "Two-minute profile"}</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">{isEditing ? "Tune your campus signal." : "Help the right people find you."}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
            {isEditing ? "Your current info is saved here. Change only what you need." : "Pick enough signal for useful recommendations. You can change this later."}
          </p>
        </div>

        <SetupNotice />
        {params?.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}

        <form action="/api/onboarding" method="post" className="motion-rise mt-5 space-y-5 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:mt-6 sm:p-5">
          <section className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-zinc-700">
              Full name
              <input name="full_name" required defaultValue={profile?.full_name ?? user.user_metadata?.full_name ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Username
              <input name="username" placeholder="arjunsharma" defaultValue={profile?.username ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Course / branch
              <select name="course" required defaultValue={profile?.course ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-cyan-600">
                <option value="">Choose your course</option>
                {courseOptionGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Graduation year
              <input name="graduation_year" type="number" min={currentYear} max={currentYear + 8} required defaultValue={profile?.graduation_year ?? currentYear + 4} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Year of study
              <select name="year_of_study" defaultValue={profile?.year_of_study ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600">
                <option value="">Choose year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Gender
              <select name="gender" defaultValue={profile?.gender ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600">
                <option value="">Choose gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Stay type
              <select name="residence_type" required defaultValue={profile?.residence_type ?? "hostel"} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600">
                <option value="hostel">Hostel student</option>
                <option value="day_scholar">Day scholar</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Hostel
              <select name="hostel" defaultValue={profile?.hostel ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-cyan-600">
                <option value="">Choose hostel</option>
                {hostelOptions.map((hostel) => (
                  <option key={hostel} value={hostel}>
                    {hostel}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Room no.
              <input name="room_no" maxLength={20} placeholder="Eg. 312" defaultValue={profile?.room_no ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white/80 p-4 text-sm font-bold text-zinc-700 sm:col-span-2">
              <input name="show_room_publicly" type="checkbox" value="true" defaultChecked={profile?.show_room_publicly ?? false} className="mt-1 h-4 w-4 rounded border-zinc-300 text-cyan-700 focus:ring-cyan-600" />
              <span>
                Show my hostel and room on my public profile
                <span className="mt-1 block text-xs font-semibold leading-5 text-zinc-500">If this is off, your location still helps matching but other students will not see your hostel or room.</span>
              </span>
            </label>
          </section>

          <section>
            <h2 className="text-base font-black text-zinc-950 sm:text-lg">What are you into?</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <label key={interest} className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700 has-checked:border-cyan-500 has-checked:bg-cyan-50 has-checked:text-cyan-800">
                  <input type="checkbox" name="interests" value={slugify(interest)} defaultChecked={selectedInterestSlugs.has(slugify(interest))} className="sr-only" />
                  {interest}
                </label>
              ))}
              {extraInterests.map((interest) => (
                <label key={interest.slug} className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700 has-checked:border-cyan-500 has-checked:bg-cyan-50 has-checked:text-cyan-800">
                  <input type="checkbox" name="interests" value={interest.slug} defaultChecked className="sr-only" />
                  {interest.name}
                </label>
              ))}
            </div>
            <input name="custom_interest" placeholder="Add an interest if yours is missing" className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
          </section>

          <section>
            <h2 className="text-base font-black text-zinc-950 sm:text-lg">What are you trying to do right now?</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {goalOptions.map((goal) => (
                <label key={goal} className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700 has-checked:border-emerald-500 has-checked:bg-emerald-50 has-checked:text-emerald-800">
                  <input type="checkbox" name="goals" value={slugify(goal)} defaultChecked={selectedGoalSlugs.has(slugify(goal))} className="sr-only" />
                  {goal}
                </label>
              ))}
              {extraGoals.map((goal) => (
                <label key={goal.slug} className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700 has-checked:border-emerald-500 has-checked:bg-emerald-50 has-checked:text-emerald-800">
                  <input type="checkbox" name="goals" value={goal.slug} defaultChecked className="sr-only" />
                  {goal.title}
                </label>
              ))}
            </div>
            <input name="custom_goal" placeholder="Add a goal if yours is missing" className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-bold text-zinc-700 sm:col-span-3">
              Bio
              <textarea name="bio" rows={4} placeholder="Tell people what you're working on." defaultValue={profile?.bio ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              GitHub
              <input name="github_url" placeholder="https://github.com/..." defaultValue={profile?.github_url ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              LinkedIn
              <input name="linkedin_url" placeholder="https://linkedin.com/in/..." defaultValue={profile?.linkedin_url ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Codeforces
              <input name="codeforces_handle" placeholder="handle" defaultValue={profile?.codeforces_handle ?? ""} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
          </section>

          <PendingSubmitButton pendingLabel="Building your matches..." className="w-full">
            {isEditing ? "Save profile" : "Start discovering"}
          </PendingSubmitButton>
        </form>
      </main>
    </PageShell>
  );
}
