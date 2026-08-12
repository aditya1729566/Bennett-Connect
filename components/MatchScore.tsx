export function MatchScore({ score }: { score: number }) {
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-800 shadow-sm">
      <svg className="absolute inset-1 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(5,150,105,0.16)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r="21"
          fill="none"
          stroke="rgba(5,150,105,0.88)"
          strokeDasharray={`${Math.min(100, Math.max(0, score)) * 1.32} 132`}
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <span className="relative">{score}%</span>
    </div>
  );
}
