type InterestBadgeProps = {
  children: React.ReactNode;
  tone?: "default" | "goal" | "quiet";
};

export function InterestBadge({ children, tone = "default" }: InterestBadgeProps) {
  const toneClass =
    tone === "goal"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "quiet"
        ? "border-stone-200 bg-stone-50 text-stone-700"
        : "border-cyan-200 bg-cyan-50 text-cyan-800";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold shadow-[0_8px_18px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] ${toneClass}`}>
      {children}
    </span>
  );
}
