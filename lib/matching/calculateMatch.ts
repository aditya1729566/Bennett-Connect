import type { Profile, Recommendation } from "@/types/domain";

const weights = {
  interest: 5,
  goal: 8,
  course: 2,
  graduationYear: 2,
  hostel: 1,
  skill: 4,
};

const maxReasonableScore = 40;

function sharedNames(a: { name?: string; title?: string }[], b: { name?: string; title?: string }[]) {
  const bValues = new Set(b.map((item) => item.name ?? item.title).filter(Boolean));
  return a.map((item) => item.name ?? item.title).filter((value): value is string => Boolean(value && bValues.has(value)));
}

export function calculateMatch(currentUser: Profile, candidate: Profile): Recommendation {
  const sharedInterests = sharedNames(currentUser.interests, candidate.interests);
  const sharedGoals = sharedNames(currentUser.goals, candidate.goals);
  const sharedSkills = sharedNames(currentUser.skills, candidate.skills);

  let rawScore = 0;
  const reasons: string[] = [];

  rawScore += sharedInterests.length * weights.interest;
  rawScore += sharedGoals.length * weights.goal;
  rawScore += sharedSkills.length * weights.skill;

  if (sharedInterests.length > 0) {
    reasons.push(`You both like ${sharedInterests.slice(0, 2).join(" and ")}.`);
  }

  if (sharedGoals.length > 0) {
    reasons.push(`You are both working toward ${sharedGoals.slice(0, 2).join(" and ")}.`);
  }

  if (sharedSkills.length > 0) {
    reasons.push(`You share ${sharedSkills.slice(0, 2).join(" and ")} as skills.`);
  }

  if (currentUser.course && currentUser.course === candidate.course) {
    rawScore += weights.course;
    reasons.push(`You are both in ${candidate.course}.`);
  }

  if (currentUser.graduation_year && currentUser.graduation_year === candidate.graduation_year) {
    rawScore += weights.graduationYear;
    reasons.push(`You graduate in the same year.`);
  }

  if (currentUser.hostel && currentUser.hostel === candidate.hostel) {
    rawScore += weights.hostel;
    reasons.push(`You are in the same hostel.`);
  }

  const score = Math.min(100, Math.round((rawScore / maxReasonableScore) * 100));

  return {
    profile: candidate,
    score,
    reasons: reasons.length > 0 ? reasons : ["You have enough campus overlap to start a useful conversation."],
  };
}
