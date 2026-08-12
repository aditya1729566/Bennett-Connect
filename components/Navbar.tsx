import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { DesktopNavLinks } from "./ActiveNavLinks";

export function Navbar({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/82 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
        <Link href={user ? "/discover" : "/"} className="min-w-0 text-base font-black text-zinc-950 sm:text-lg">
          <span className="sm:hidden">Bennett Connect</span>
          <span className="hidden sm:inline">Find My People</span>
        </Link>
        <DesktopNavLinks signedIn={Boolean(user)} />
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Link href="/settings" className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-700">
              Settings
            </Link>
          ) : (
            <Link href="/signup" className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white">
              Join
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
