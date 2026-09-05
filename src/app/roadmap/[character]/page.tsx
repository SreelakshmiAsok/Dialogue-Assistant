"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { fetchQuestions, fetchTier2Lessons } from "@/lib/api";
import { getCharacterByBackendName } from "@/lib/characters";
import { getCharacterProgress } from "@/lib/progress";
import type { Question, Tier2LessonSummary } from "@/lib/api";
import type { CharacterMeta } from "@/lib/characters";
import type { CharacterProgress } from "@/lib/progress";

export default function RoadmapPage({ params }: { params: Promise<{ character: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const characterName = unwrappedParams.character;

  const [charMeta, setCharMeta] = useState<CharacterMeta | null>(null);
  const [tier1Lessons, setTier1Lessons] = useState<Question[]>([]);
  const [tier2Lessons, setTier2Lessons] = useState<Tier2LessonSummary[]>([]);
  const [progress, setProgress] = useState<CharacterProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const meta = getCharacterByBackendName(characterName);
    setCharMeta(meta || null);

    const charProgress = getCharacterProgress(characterName);
    setProgress(charProgress);

    // Fetch Tier 1
    fetchQuestions(characterName)
      .then((qs) => {
        setTier1Lessons(qs);
        // If Tier 2 unlocked, fetch Tier 2
        if (charProgress.tier2Unlocked) {
          fetchTier2Lessons(characterName)
            .then(t2 => setTier2Lessons(t2))
            .catch(console.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [characterName]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!charMeta) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p>Character not found.</p>
      </div>
    );
  }

  const completedCount = progress?.completedLessons.length || 0;
  const isTier2Unlocked = progress?.tier2Unlocked || false;

  return (
    <div className="bg-background text-on-background min-h-screen font-sans antialiased overflow-x-hidden pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface-variant p-4 md:px-8 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => router.push("/choose-friend")}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
            <img src={charMeta.imagePath} alt={charMeta.displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface">{charMeta.displayName} Roadmap</h1>
            <p className="text-sm text-on-surface-variant">{completedCount}/5 Tier-1 lessons completed</p>
          </div>
        </div>
      </header>

      {/* Roadmap Path */}
      <main className="max-w-md mx-auto pt-12 px-6 flex flex-col items-center relative">
        {/* Background Track Line */}
        <div className="absolute top-12 bottom-32 w-2 bg-surface-container-highest rounded-full z-0 translate-x-[2px]" />

        <div className="w-full flex flex-col items-center gap-8 relative z-10">
          
          {/* Tier 1 Section */}
          <div className="text-center mb-4 bg-surface px-6 py-2 rounded-full border border-surface-variant text-on-surface-variant font-bold text-sm tracking-widest uppercase">
            Basics
          </div>

          {tier1Lessons.map((lesson, index) => {
            const isCompleted = progress?.completedLessons.includes(lesson.id);
            const isAvailable = isCompleted || index === 0 || progress?.completedLessons.includes(tier1Lessons[index - 1].id);
            const stars = progress?.lessonStars[lesson.id] || 0;

            let stateClass = "";
            let icon = "";
            
            if (isCompleted) {
              stateClass = "bg-primary text-on-primary ring-4 ring-primary-container";
              icon = "check";
            } else if (isAvailable) {
              stateClass = "bg-secondary text-on-secondary ring-4 ring-secondary-container animate-pulse-slow";
              icon = "play_arrow";
            } else {
              stateClass = "bg-surface-variant text-on-surface-variant opacity-70";
              icon = "lock";
            }

            return (
              <div key={lesson.id} className="flex flex-col items-center gap-2 w-full">
                <button
                  disabled={!isAvailable}
                  onClick={() => router.push(`/session?character=${charMeta.backendName}&lessonId=${lesson.id}&tier=1`)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 ${stateClass} ${!isAvailable && 'cursor-not-allowed'}`}
                >
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                </button>
                <div className="text-center bg-surface/80 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <h3 className={`font-bold ${isAvailable ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    Lesson {index + 1}
                  </h3>
                  {isCompleted && stars > 0 && (
                    <div className="flex justify-center text-primary mt-1">
                      {Array(stars).fill(0).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Tier 2 Milestone Banner */}
          <div className="w-full mt-12 mb-8">
            <div className={`p-6 rounded-3xl text-center border-4 shadow-lg transition-all ${
              isTier2Unlocked 
                ? 'bg-tertiary-container border-tertiary text-on-tertiary-container animate-float' 
                : 'bg-surface-container border-surface-variant text-on-surface-variant opacity-80'
            }`}>
              <div className="flex justify-center mb-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isTier2Unlocked ? 'bg-tertiary text-on-tertiary' : 'bg-surface-variant text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isTier2Unlocked ? 'forum' : 'lock'}
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Tier 2: Conversations</h2>
              <p className="text-sm font-medium">
                {isTier2Unlocked 
                  ? "You unlocked multi-turn conversations! 🎉"
                  : `Complete ${Math.max(0, 5 - completedCount)} more lessons to unlock.`}
              </p>
            </div>
          </div>

          {/* Tier 2 Lessons (if unlocked) */}
          {isTier2Unlocked && tier2Lessons.map((lesson, index) => {
            // For Tier 2, we can just make them all available, or use the same logic if we track tier 2 completions
            // The prompt said: "Tier 2 lessons should use the existing Tier-2/two-turn conversation architecture"
            const isCompleted = progress?.completedLessons.includes(lesson.id);
            const stars = progress?.lessonStars[lesson.id] || 0;
            
            return (
              <div key={lesson.id} className="flex flex-col items-center gap-2 w-full mt-4">
                <button
                  onClick={() => router.push(`/session?character=${charMeta.backendName}&lessonId=${lesson.id}&tier=2`)}
                  className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-md transition-all active:scale-95 ${
                    isCompleted ? 'bg-tertiary text-on-tertiary ring-4 ring-tertiary-container' : 'bg-surface-container-highest text-tertiary ring-4 ring-tertiary-container hover:bg-tertiary hover:text-on-tertiary'
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isCompleted ? 'check' : 'play_arrow'}
                  </span>
                </button>
                <div className="text-center bg-surface/80 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <h3 className="font-bold text-on-surface">Conversation {index + 1}</h3>
                  <p className="text-xs text-on-surface-variant">{lesson.skill}</p>
                  {isCompleted && stars > 0 && (
                    <div className="flex justify-center text-tertiary mt-1">
                      {Array(stars).fill(0).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </main>
    </div>
  );
}
