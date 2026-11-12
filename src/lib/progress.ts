import { getToken } from "./auth";

export interface CharacterProgress {
  completedLessons: string[];
  lessonStars: Record<string, number>;
  tier2Unlocked: boolean;
}

export type RoadmapProgress = Record<string, CharacterProgress>;

function getStorageKey(): string {
  if (typeof window === "undefined") return "dialogue_roadmap_progress";
  try {
    const token = getToken();
    if (token) {
      const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      const uid = payload.user_id || payload.sub || payload.id || payload.email;
      if (uid) return `dialogue_roadmap_progress_${uid}`;
    }
  } catch {
    // fallback if token cannot be decoded
  }
  return "dialogue_roadmap_progress_guest";
}

const defaultProgress: CharacterProgress = {
  completedLessons: [],
  lessonStars: {},
  tier2Unlocked: false,
};

export function getRoadmapProgress(): RoadmapProgress {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(getStorageKey());
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to parse roadmap progress", e);
  }
  return {};
}

export function getCharacterProgress(character: string): CharacterProgress {
  const allProgress = getRoadmapProgress();
  return allProgress[character.toLowerCase()] || { ...defaultProgress };
}

export function saveLessonCompletion(
  character: string,
  lessonId: string,
  stars: number
): void {
  if (typeof window === "undefined") return;
  const allProgress = getRoadmapProgress();
  const charKey = character.toLowerCase();
  
  if (!allProgress[charKey]) {
    allProgress[charKey] = {
      completedLessons: [],
      lessonStars: {},
      tier2Unlocked: false,
    };
  }

  const charProgress = allProgress[charKey];
  
  // Update stars (keep the highest score)
  const existingStars = charProgress.lessonStars[lessonId] || 0;
  charProgress.lessonStars[lessonId] = Math.max(existingStars, stars);
  
  // Add to completed lessons if not already there and if stars >= threshold (e.g. 1 star is a pass for now)
  if (stars > 0 && !charProgress.completedLessons.includes(lessonId)) {
    charProgress.completedLessons.push(lessonId);
  }

  // Check for Tier 2 unlock condition (5 completed Tier-1 lessons)
  // Assuming Tier 2 lessons have a different ID format or we just count all completed
  // For safety, we can just check if length >= 5.
  if (charProgress.completedLessons.length >= 5) {
    charProgress.tier2Unlocked = true;
  }

  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(allProgress));
  } catch (e) {
    console.error("Failed to save roadmap progress", e);
  }
}
