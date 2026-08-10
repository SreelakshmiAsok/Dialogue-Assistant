// ============================================================
// CHARACTER METADATA — Maps backend names to UI display info
// ============================================================

export interface CharacterMeta {
  id: string;
  backendName: string;
  displayName: string;
  subtitle: string;
  imagePath: string;
  backgroundPath: string;
  difficulty: "easy" | "medium" | "hard";
  difficultyLabel: string;
  context: string;
  color: string;
}

export const CHARACTERS: CharacterMeta[] = [
  {
    id: "father",
    backendName: "Father",
    displayName: "Dad (Appa)",
    subtitle: "Honesty & Apologies",
    imagePath: "/images/dad_user.png",
    backgroundPath: "/images/livingroom_bg.png",
    difficulty: "easy",
    difficultyLabel: "⭐ Beginner Friendly",
    context: "Practice talking to your father at home",
    color: "#6366f1",
  },
  {
    id: "teacher",
    backendName: "Teacher",
    displayName: "Teacher",
    subtitle: "Classroom Decorum",
    imagePath: "/images/teacher_user.png",
    backgroundPath: "/images/classroom_bg.png",
    difficulty: "medium",
    difficultyLabel: "⭐⭐ Intermediate",
    context: "Practice talking to your teacher at school",
    color: "#8b5cf6",
  },
  {
    id: "friend",
    backendName: "Friend",
    displayName: "Friend",
    subtitle: "Sharing & Turn-Taking",
    imagePath: "/images/friend_user.png",
    backgroundPath: "/images/playground_bg.png",
    difficulty: "easy",
    difficultyLabel: "⭐ Beginner Friendly",
    context: "Practice talking to your friend",
    color: "#f59e0b",
  },
  {
    id: "stranger",
    backendName: "Stranger",
    displayName: "Stranger",
    subtitle: "Safety & Danger Rules",
    imagePath: "/images/stranger_perfect.png",
    backgroundPath: "/images/sidewalk_bg.png",
    difficulty: "hard",
    difficultyLabel: "🚨 Safety Critical",
    context: "Practice staying safe with strangers",
    color: "#10b981",
  },
];

export function getCharacterByBackendName(name: string): CharacterMeta | undefined {
  return CHARACTERS.find((c) => c.backendName === name);
}

export function getCharacterById(id: string): CharacterMeta | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
