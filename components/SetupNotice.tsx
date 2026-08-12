import { isSupabaseConfigured } from "@/lib/supabase/config";

export function SetupNotice() {
  if (isSupabaseConfigured) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Add your Supabase URL and anon key to the environment before using sign-in, onboarding, or live data.
    </div>
  );
}
