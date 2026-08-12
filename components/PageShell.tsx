import { BottomNav } from "./BottomNav";
import { Navbar } from "./Navbar";
import { getUser } from "@/lib/supabase/server";

export async function PageShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <div className="page-mesh min-h-screen bg-[#f5f7fb] pb-[calc(5.25rem+env(safe-area-inset-bottom))] text-zinc-950 sm:pb-0">
      <Navbar user={user} />
      {children}
      <BottomNav user={user} />
    </div>
  );
}
