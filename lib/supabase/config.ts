export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

export const allowedEmailDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "bennett.edu.in")
  .split(",")
  .map((domain) => domain.trim().replace(/^@/, "").toLowerCase())
  .filter(Boolean);

export function isAllowedCampusEmail(email: string) {
  if (allowedEmailDomains.length === 0) {
    return true;
  }

  const normalized = email.trim().toLowerCase();
  return allowedEmailDomains.some((domain) => normalized.endsWith(`@${domain}`));
}
