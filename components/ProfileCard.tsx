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
  const { profile, score, reasons } = recommendation;
  const topSignal = profile.interests[0]?.name ?? profile.goals[0]?.title ?? profile.course ?? "Campus match";

  return (
    <article className="interactive-card group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="absolute right-4 top-4 hidden rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-orange-700 sm:block">
        {topSignal}
      </div>
      <div className="relative flex items-start gap-3 sm:gap-4">
        <ProfileAvatar src={profile.avatar_url} name={profile.full_name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={`/profile/${profile.username}`} className="block truncate text-lg font-black text-zinc-950 sm:text-xl">
                {profile.full_name}
              </Link>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                {[profile.course, profile.year_of_study ?? profile.graduation_year].filter(Boolean).join(" • ")}
              </p>
            </div>
            <div className="shrink-0">
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

      <div className="relative mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Why this could click</p>
        <ul className="mt-2 space-y-1 text-sm leading-5 text-zinc-700">
          {reasons.slice(0, 3).map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {actions ? <div className="relative mt-4 flex gap-2 sm:gap-3">{actions}</div> : null}
    </article>
  );
}
