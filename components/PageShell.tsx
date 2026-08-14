import { BottomNav } from "./BottomNav";
import { CampusSignalScene } from "./CampusSignalScene";
import { InterfaceMotion } from "./InterfaceMotion";
import { Navbar } from "./Navbar";
import { PushNotificationPrompt } from "./PushNotificationPrompt";
import { getUser } from "@/lib/supabase/server";

export async function PageShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <div className="page-3d page-mesh relative isolate min-h-screen overflow-hidden bg-[#f5f7fb] pb-[calc(5.25rem+env(safe-area-inset-bottom))] text-zinc-950 sm:pb-0">
      <CampusSignalScene />
      <InterfaceMotion />
      <Navbar user={user} />
      <div className="relative z-30">{children}</div>
      {user ? <PushNotificationPrompt /> : null}
      <BottomNav user={user} />
    </div>
  );
}
