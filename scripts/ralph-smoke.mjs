import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function check(name, condition, detail = "") {
  if (!condition) {
    failures.push(`${name}${detail ? `: ${detail}` : ""}`);
  }
}

const requiredRoutes = [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/signup/page.tsx",
  "app/auth/callback/route.ts",
  "app/onboarding/page.tsx",
  "app/discover/page.tsx",
  "app/profile/[username]/page.tsx",
  "app/requests/page.tsx",
  "app/connections/page.tsx",
  "app/chat/[connectionId]/page.tsx",
  "app/settings/page.tsx",
];

for (const route of requiredRoutes) {
  check("required route exists", existsSync(join(root, route)), route);
}

const packageJson = JSON.parse(read("package.json"));
check("lint script exists", packageJson.scripts?.lint === "eslint");
check("build script exists", packageJson.scripts?.build === "next build");

const envExample = read(".env.example");
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  check("env example has required key", envExample.includes(`${key}=`), key);
  check("env example does not contain real values", !new RegExp(`${key}=\\S+`).test(envExample), key);
}

const landing = read("app/page.tsx");
check("landing features Aditya", landing.includes("Aditya Agrawal"));
check("landing has Aditya username", landing.includes('FEATURED_USERNAME = "anarchistgoverner"'));
check("landing builds profile link", landing.includes("`/profile/${FEATURED_USERNAME}`"));
check("landing links Aditya website", landing.includes("https://personal-website-bay-omega.vercel.app"));
check("landing has working profile CTA", landing.includes("View profile"));
check("landing removed old decorative signal", !landing.includes("connect signal"));

const microsoftButton = read("components/MicrosoftSignInButton.tsx");
const authCallback = read("app/auth/callback/route.ts");
check("Outlook login uses Supabase Azure provider", microsoftButton.includes('provider: "azure"'));
check("Outlook login requests email scope", microsoftButton.includes('scopes: "email"'));
check("Outlook login has callback route", microsoftButton.includes("/auth/callback?next=/discover"));
check("OAuth callback exchanges auth code", authCallback.includes("exchangeCodeForSession"));
check("OAuth callback enforces campus email domain", authCallback.includes("isAllowedCampusEmail"));

const initialMigration = read("supabase/migrations/001_initial_schema.sql");
for (const table of ["profiles", "connection_requests", "requests", "request_responses", "reports"]) {
  check("RLS enabled for core table", initialMigration.includes(`alter table public.${table} enable row level security`), table);
}
for (const policy of [
  "Users can update their profile",
  "Users send connection requests as themselves",
  "Receivers can update connection status",
  "Users create own requests",
  "Users respond as themselves",
  "Users can create reports as themselves",
]) {
  check("core RLS policy exists", initialMigration.includes(policy), policy);
}

const chatMigration = read("supabase/migrations/002_chat_messages.sql");
check("chat migration is policy-idempotent", chatMigration.includes('drop policy if exists "Accepted connection participants can read chat messages"'));
check("chat migration is send-policy-idempotent", chatMigration.includes('drop policy if exists "Accepted connection participants can send chat messages"'));

const scannedFiles = [
  ".env.example",
  "app/page.tsx",
  "lib/supabase/config.ts",
  "README.md",
  "supabase/migrations/001_initial_schema.sql",
  "supabase/migrations/002_chat_messages.sql",
];
const secretPatterns = [
  /postgresql:\/\/[^"\s]+/i,
  /SUPABASE_SERVICE_ROLE_KEY=\S+/,
  /NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ/,
  /qevxux/i,
];

for (const file of scannedFiles) {
  const content = read(file);
  for (const pattern of secretPatterns) {
    check("no obvious secret in committed source", !pattern.test(content), file);
  }
}

if (failures.length > 0) {
  console.error("RALPH smoke failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("RALPH smoke passed.");
