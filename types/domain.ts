export type Interest = {
  id: number;
  name: string;
  slug: string;
};

export type Goal = {
  id: number;
  title: string;
  slug: string;
};

export type Skill = {
  id: number;
  name: string;
  slug: string;
  level?: "beginner" | "intermediate" | "advanced" | null;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  university_id: number | null;
  university_name?: string | null;
  course: string | null;
  graduation_year: number | null;
  year_of_study: string | null;
  hostel: string | null;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  codeforces_handle: string | null;
  interests: Interest[];
  goals: Goal[];
  skills: Skill[];
};

export type Recommendation = {
  profile: Profile;
  score: number;
  reasons: string[];
};

export type NeedRequest = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: "active" | "fulfilled" | "expired" | "deleted";
  expires_at: string | null;
  created_at: string;
  author?: Pick<Profile, "username" | "full_name" | "avatar_url" | "course" | "graduation_year"> | null;
  interests: Interest[];
};

export type ChatMessage = {
  id: number;
  connection_request_id: number;
  sender_id: string;
  body: string;
  created_at: string;
};
