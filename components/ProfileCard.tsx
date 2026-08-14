import Link from "next/link";
import { InterestBadge } from "./InterestBadge";
import { MatchScore } from "./MatchScore";
import { ProfileAvatar } from "./ProfileAvatar";
import type { Recommendation } from "@/types/domain";

type ProfileCardProps = {
  recommendation: Recommendation;
  actions?: React.ReactNode;
};

export function ProfileCard({ recommendation, actions }: ProfileCardProps) {
  const { profile, score } = recommendation;
  const topSignal = profile.interests[0]?.name ?? profile.goals[0]?.title ?? profile.course ?? "Campus match";

  return (
    <article className="interactive-card motion-rise group w-full min-w-0 rounded-xl border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:gap-4">
        <ProfileAvatar src={profile.avatar_url} name={profile.full_name} size="md" />
        <div className="min-w-0 sm:hidden">
          <Link href={`/profile/${profile.username}`} className="block truncate text-lg font-black leading-tight text-zinc-950 sm:text-xl">
            {profile.full_name}
          </Link>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-zinc-500 sm:text-sm">
            {[profile.course, profile.year_of_study ?? profile.graduation_year].filter(Boolean).join(" • ")}
          </p>
        </div>
        <div className="self-start sm:hidden">
          <MatchScore score={score} />
        </div>

        <div className="col-span-3 min-w-0 sm:col-span-1 sm:flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="hidden min-w-0 sm:block">
              <Link href={`/profile/${profile.username}`} className="block truncate text-lg font-black text-zinc-950 sm:text-xl">
                {profile.full_name}
              </Link>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                {[profile.course, profile.year_of_study ?? profile.graduation_year].filter(Boolean).join(" • ")}
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-3 self-start sm:flex sm:flex-col sm:items-end">
              <span className="hidden max-w-56 truncate rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-orange-700 sm:block">
                {topSignal}
              </span>
              <MatchScore score={score} />
            </div>
          </div>
          {profile.bio ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-700 sm:line-clamp-none">{profile.bio}</p> : null}
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {profile.interests.slice(0, 4).map((interest) => (
          <InterestBadge key={interest.id}>{interest.name}</InterestBadge>
        ))}
        {profile.goals.slice(0, 2).map((goal) => (
          <InterestBadge key={goal.id} tone="goal">
            {goal.title}
          </InterestBadge>
        ))}
      </div>

      {actions ? <div className="relative mt-4 flex gap-2 sm:gap-3">{actions}</div> : null}
    </article>
  );
}
