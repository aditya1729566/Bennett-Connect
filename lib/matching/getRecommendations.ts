import { calculateMatch } from "./calculateMatch";
import type { Profile, Recommendation } from "@/types/domain";

export function getRecommendations(currentUser: Profile, candidates: Profile[], excludedIds = new Set<string>()) {
  return candidates
    .filter((candidate) => candidate.id !== currentUser.id)
    .filter((candidate) => !excludedIds.has(candidate.id))
    .map((candidate): Recommendation => calculateMatch(currentUser, candidate))
    .sort((a, b) => b.score - a.score);
}
