import { NextResponse, type NextRequest } from "next/server";
import { courseOptions, hostelOptions, interestOptions } from "@/lib/data/options";
import { slugify, usernameFromName } from "@/lib/data/slug";
import { createAdminClient, createClient, getUser } from "@/lib/supabase/server";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function onboardingError(request: NextRequest, message: string) {
  return redirectTo(request, `/onboarding?error=${encodeURIComponent(message)}`);
}

const genderOptions = new Set(["male", "female", "non_binary", "prefer_not_to_say"]);
const allowedCourses = new Set<string>(courseOptions);
const allowedHostels = new Set<string>(hostelOptions);

function normalizeSocialHandle(value: FormDataEntryValue | null) {
  const input = String(value ?? "").trim();
  if (!input) {
    return null;
  }

  const withoutAt = input.replace(/^@+/, "");
  try {
    const parsed = new URL(withoutAt.startsWith("http") ? withoutAt : `https://${withoutAt}`);
    const [handle] = parsed.pathname.split("/").filter(Boolean);
    return handle?.replace(/^@+/, "") || null;
  } catch {
    return withoutAt.split("/").filter(Boolean).pop()?.split("?")[0] || null;
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return redirectTo(request, "/login");
  }

  const formData = await request.formData();
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const genderInput = String(formData.get("gender") ?? "").trim();
  const gender = genderOptions.has(genderInput) ? genderInput : null;
  const residenceType = String(formData.get("residence_type") ?? "hostel") === "day_scholar" ? "day_scholar" : "hostel";
  const hostel = String(formData.get("hostel") ?? "").trim().toUpperCase();
  const roomNo = String(formData.get("room_no") ?? "").trim();
  const showRoomPublicly = formData.get("show_room_publicly") === "true";
  const graduationYear = Number(formData.get("graduation_year"));
  const selectedInterestSlugs = formData.getAll("interests").map(String);
  const selectedGoalSlugs = formData.getAll("goals").map(String);

  if (!fullName || !course || !graduationYear) {
    return onboardingError(request, "Full name, course, and graduation year are required.");
  }

  if (!allowedCourses.has(course)) {
    return onboardingError(request, "Choose a valid Bennett University course from the dropdown.");
  }

  if (genderInput && !gender) {
    return onboardingError(request, "Choose a valid gender option.");
  }

  if (residenceType === "hostel" && (!hostel || !roomNo)) {
    return onboardingError(request, "Hostel and room number are required so students can find you on campus.");
  }

  if (residenceType === "hostel" && !allowedHostels.has(hostel)) {
    return onboardingError(request, "Choose a valid hostel from the dropdown.");
  }

  if (residenceType === "hostel" && roomNo.length > 20) {
    return onboardingError(request, "Room number must be 20 characters or fewer.");
  }

  const customInterest = String(formData.get("custom_interest") ?? "").trim();
  if (selectedInterestSlugs.length < 1 && !customInterest) {
    return onboardingError(request, "Choose or add at least one interest so recommendations can work.");
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
    gender,
    residence_type: residenceType,
    hostel: residenceType === "hostel" ? hostel : null,
    room_no: residenceType === "hostel" ? roomNo : null,
    show_room_publicly: residenceType === "hostel" ? showRoomPublicly : false,
    bio: String(formData.get("bio") ?? "").trim() || null,
    github_url: String(formData.get("github_url") ?? "").trim() || null,
    linkedin_url: String(formData.get("linkedin_url") ?? "").trim() || null,
    instagram_url: normalizeSocialHandle(formData.get("instagram_url")),
    x_url: normalizeSocialHandle(formData.get("x_url")),
    codeforces_handle: String(formData.get("codeforces_handle") ?? "").trim() || null,
  });

  if (profileError) {
    return onboardingError(request, profileError.message);
  }

  let interestSlugs = [...new Set(selectedInterestSlugs)];
  const selectedSlugSet = new Set(interestSlugs);
  const knownSelectedInterests = interestOptions
    .filter((interest) => selectedSlugSet.has(slugify(interest)))
    .map((interest) => ({ name: interest, slug: slugify(interest) }));

  if (knownSelectedInterests.length > 0) {
    const { error: seedInterestError } = await adminSupabase.from("interests").upsert(knownSelectedInterests, { onConflict: "slug" });
    if (seedInterestError) {
      return onboardingError(request, seedInterestError.message);
    }
  }

  if (customInterest) {
    const customSlug = slugify(customInterest);
    const { error: customInterestError } = await adminSupabase.from("interests").upsert({ name: customInterest, slug: customSlug }, { onConflict: "slug" });
    if (customInterestError) {
      return onboardingError(request, customInterestError.message);
    }
    interestSlugs = [...new Set([...interestSlugs, customSlug])];
  }

  const { data: interests, error: interestLookupError } = await adminSupabase.from("interests").select("id, slug").in("slug", interestSlugs);
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
