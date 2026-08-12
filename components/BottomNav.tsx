import type { User } from "@supabase/supabase-js";
import { MobileBottomNavLinks } from "./ActiveNavLinks";

export function BottomNav({ user }: { user: User | null }) {
  if (!user) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] md:hidden">
      <MobileBottomNavLinks />
    </nav>
  );
}
