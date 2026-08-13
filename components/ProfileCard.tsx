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
    <article className="interactive-card group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
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
            <div className="flex shrink-0 items-center gap-3 self-start sm:flex-col sm:items-end">
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
