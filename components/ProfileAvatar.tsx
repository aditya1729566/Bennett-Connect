type ProfileAvatarProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

export function ProfileAvatar({ src, name, size = "md" }: ProfileAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeClass = size === "lg" ? "h-24 w-24 text-2xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-16 w-16 text-lg";
  const palettes = [
    "from-cyan-500 via-teal-500 to-emerald-500",
    "from-zinc-900 via-cyan-800 to-cyan-500",
    "from-orange-500 via-rose-500 to-zinc-900",
    "from-emerald-600 via-lime-500 to-cyan-500",
  ];
  const paletteIndex = (name.charCodeAt(0) || 0) % palettes.length;
  const palette = palettes[paletteIndex];

  if (src) {
    // Supabase avatar URLs are user-provided remote images, so keep rendering flexible for the MVP.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`${name} profile photo`} className={`${sizeClass} rounded-full border-2 border-white object-cover shadow-sm`} />;
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-gradient-to-br ${palette} font-black text-white shadow-sm ring-2 ring-white`}>
      {initials || "FP"}
    </div>
  );
}
