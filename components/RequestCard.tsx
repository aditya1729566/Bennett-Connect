import Link from "next/link";
import { InterestBadge } from "./InterestBadge";
import { ProfileAvatar } from "./ProfileAvatar";
import type { NeedRequest } from "@/types/domain";

type RequestCardProps = {
  request: NeedRequest;
  action?: React.ReactNode;
};

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relativeTime(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }
  return formatter.format(Math.round(minutes / 60), "hour");
}

export function RequestCard({ request, action }: RequestCardProps) {
  return (
    <article className="interactive-card motion-rise rounded-xl border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-700">{request.category}</p>
          <h2 className="mt-2 break-words text-lg font-black text-zinc-950 sm:text-xl">{request.title}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-600 sm:text-xs">{relativeTime(request.created_at)}</span>
      </div>

      <p className="relative mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">{request.description}</p>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {request.interests.map((interest) => (
          <InterestBadge key={interest.id}>{interest.name}</InterestBadge>
        ))}
      </div>

      {request.author ? (
        <Link href={`/profile/${request.author.username}`} className="relative mt-4 flex min-w-0 items-center gap-3 text-sm font-semibold text-zinc-700">
          <ProfileAvatar src={request.author.avatar_url} name={request.author.full_name} size="sm" />
          <span className="truncate">{request.author.full_name}</span>
        </Link>
      ) : null}

      {action ? <div className="relative mt-4">{action}</div> : null}
    </article>
  );
}
