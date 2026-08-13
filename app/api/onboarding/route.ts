import { NextResponse, type NextRequest } from "next/server";
import { slugify, usernameFromName } from "@/lib/data/slug";
import { createClient, getUser } from "@/lib/supabase/server";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function onboardingError(request: NextRequest, message: string) {
  return redirectTo(request, `/onboarding?error=${encodeURIComponent(message)}`);
}

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return redirectTo(request, "/login");
  }

  const formData = await request.formData();
  const supabase = await createClient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const graduationYear = Number(formData.get("graduation_year"));
  const selectedInterestSlugs = formData.getAll("interests").map(String);
  const selectedGoalSlugs = formData.getAll("goals").map(String);

  if (!fullName || !course || !graduationYear) {
    return onboardingError(request, "Full name, course, and graduation year are required.");
  }

  if (selectedInterestSlugs.length < 1) {
    return onboardingError(request, "Choose at least one interest so recommendations can work.");
  }

  if (selectedGoalSlugs.length < 1 && !String(formData.get("custom_goal") ?? "").trim()) {
    return onboardingError(request, "Choose or add at least one goal.");
  }

  const usernameInput = String(formData.get("username") ?? "").trim();
  const username = slugify(usernameInput || `${usernameFromName(fullName)}-${user.id.slice(0, 5)}`);
  const customGoal = String(formData.get("custom_goal") ?? "").trim();
  const { data: university, error: universityError } = await supabase.from("universities").select("id").eq("slug", "bennett").maybeSingle();

  if (universityError) {
    return onboardingError(request, universityError.message);
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    username,
    full_name: fullName,
    university_id: university?.id ?? null,
    course,
    graduation_year: graduationYear,
    year_of_study: String(formData.get("year_of_study") ?? "").trim() || null,
    hostel: String(formData.get("hostel") ?? "").trim() || null,
    room_no: String(formData.get("room_no") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    github_url: String(formData.get("github_url") ?? "").trim() || null,
    linkedin_url: String(formData.get("linkedin_url") ?? "").trim() || null,
    codeforces_handle: String(formData.get("codeforces_handle") ?? "").trim() || null,
  });

  if (profileError) {
    return onboardingError(request, profileError.message);
  }

  const { data: interests, error: interestLookupError } = await supabase.from("interests").select("id, slug").in("slug", selectedInterestSlugs);
  if (interestLookupError) {
    return onboardingError(request, interestLookupError.message);
  }

  const { error: deleteInterestError } = await supabase.from("user_interests").delete().eq("user_id", user.id);
  if (deleteInterestError) {
    return onboardingError(request, deleteInterestError.message);
  }

  if (interests && interests.length > 0) {
    const { error: insertInterestError } = await supabase.from("user_interests").insert(interests.map((interest) => ({ user_id: user.id, interest_id: interest.id })));
    if (insertInterestError) {
      return onboardingError(request, insertInterestError.message);
    }
  }

  let goalSlugs = [...selectedGoalSlugs];
  if (customGoal) {
    const customSlug = slugify(customGoal);
    const { error: customGoalError } = await supabase.from("goals").upsert({ title: customGoal, slug: customSlug }, { onConflict: "slug" });
    if (customGoalError) {
      return onboardingError(request, customGoalError.message);
    }
    goalSlugs = [...goalSlugs, customSlug];
  }

  const { data: goals, error: goalLookupError } = await supabase.from("goals").select("id, slug").in("slug", goalSlugs);
  if (goalLookupError) {
    return onboardingError(request, goalLookupError.message);
  }

  const { error: deleteGoalError } = await supabase.from("user_goals").delete().eq("user_id", user.id);
  if (deleteGoalError) {
    return onboardingError(request, deleteGoalError.message);
  }

  if (goals && goals.length > 0) {
    const { error: insertGoalError } = await supabase.from("user_goals").insert(goals.map((goal) => ({ user_id: user.id, goal_id: goal.id })));
    if (insertGoalError) {
      return onboardingError(request, insertGoalError.message);
    }
  }

  return redirectTo(request, "/discover");
}
