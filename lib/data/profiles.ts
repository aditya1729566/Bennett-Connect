import type { SupabaseClient } from "@supabase/supabase-js";
import { withTimeoutFallback } from "@/lib/async/withTimeout";
import type { Database } from "@/types/database";
import type { Goal, Interest, Profile, Skill } from "@/types/domain";

type RawProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  university_id: number | null;
  course: string | null;
  graduation_year: number | null;
  year_of_study: string | null;
  gender: Profile["gender"];
  residence_type: "hostel" | "day_scholar" | null;
  hostel: string | null;
  room_no: string | null;
  show_room_publicly: boolean | null;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  codeforces_handle: string | null;
  universities?: { name: string | null } | null;
  user_interests?: { interests: Interest | null }[];
  user_goals?: { goals: Goal | null }[];
  user_skills?: { level: Skill["level"]; skills: Omit<Skill, "level"> | null }[];
};

function present<T>(value: T | null | undefined): value is T {
  return Boolean(value);
}

const profileSelect = `
  id,
  username,
  full_name,
  avatar_url,
  university_id,
  course,
  graduation_year,
  year_of_study,
  gender,
  residence_type,
  hostel,
  room_no,
  show_room_publicly,
  bio,
  github_url,
  linkedin_url,
  instagram_url,
  x_url,
  codeforces_handle,
  universities(name),
  user_interests(interests(id,name,slug)),
  user_goals(goals(id,title,slug)),
  user_skills(level,skills(id,name,slug))
`;

export function mapProfile(raw: RawProfile): Profile {
  return {
    id: raw.id,
    username: raw.username,
    full_name: raw.full_name,
    avatar_url: raw.avatar_url,
    university_id: raw.university_id,
    university_name: raw.universities?.name ?? null,
    course: raw.course,
    graduation_year: raw.graduation_year,
    year_of_study: raw.year_of_study,
    gender: raw.gender,
    residence_type: raw.residence_type,
    hostel: raw.hostel,
    room_no: raw.room_no,
    show_room_publicly: Boolean(raw.show_room_publicly),
    bio: raw.bio,
    github_url: raw.github_url,
    linkedin_url: raw.linkedin_url,
    instagram_url: raw.instagram_url,
    x_url: raw.x_url,
    codeforces_handle: raw.codeforces_handle,
    interests: raw.user_interests?.map((row) => row.interests).filter(present) ?? [],
    goals: raw.user_goals?.map((row) => row.goals).filter(present) ?? [],
    skills: raw.user_skills?.map((row) => (row.skills ? { ...row.skills, level: row.level } : null)).filter(present) ?? [],
  };
}

export async function getProfileById(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await withTimeoutFallback(supabase.from("profiles").select(profileSelect).eq("id", id).maybeSingle(), 3500, "Profile lookup by id", { data: null, error: null });
  if (error || !data) {
    return null;
  }
  return mapProfile(data as RawProfile);
}

export async function getProfileByUsername(supabase: SupabaseClient<Database>, username: string) {
  const { data, error } = await withTimeoutFallback(supabase.from("profiles").select(profileSelect).eq("username", username).maybeSingle(), 3500, "Profile lookup by username", { data: null, error: null });
  if (error || !data) {
    return null;
  }
  return mapProfile(data as RawProfile);
}

export async function getAllProfiles(supabase: SupabaseClient<Database>) {
  const { data, error } = await withTimeoutFallback(supabase.from("profiles").select(profileSelect).order("updated_at", { ascending: false }).limit(100), 4500, "Profile list lookup", { data: [], error: null });
  if (error || !data) {
    return [];
  }
  return (data as RawProfile[]).map(mapProfile);
}

export async function getExcludedRecommendationIds(supabase: SupabaseClient<Database>, userId: string) {
  const excluded = new Set<string>();

  const { data: connections } = await withTimeoutFallback(
    supabase
      .from("connection_requests")
      .select("sender_id, receiver_id, status")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .in("status", ["pending", "accepted", "blocked"]),
    3000,
    "Recommendation connection exclusions",
    { data: [], error: null },
  );

  (connections as { sender_id: string; receiver_id: string }[] | null)?.forEach((connection) => {
    excluded.add(connection.sender_id === userId ? connection.receiver_id : connection.sender_id);
  });

  const { data: skips } = await withTimeoutFallback(supabase.from("profile_skips").select("skipped_user_id").eq("user_id", userId), 3000, "Recommendation skip exclusions", { data: [], error: null });
  (skips as { skipped_user_id: string }[] | null)?.forEach((skip) => excluded.add(skip.skipped_user_id));

  return excluded;
}
