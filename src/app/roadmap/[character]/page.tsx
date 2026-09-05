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
  const [showAllTier1, setShowAllTier1] = useState(false);

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
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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

  // The 5 foundational lessons that unlock Tier 2
  const visibleTier1Lessons = showAllTier1 ? tier1Lessons : tier1Lessons.slice(0, 5);

  return (
    <div className="bg-background text-on-background min-h-screen font-sans antialiased relative pb-24">
      {/* Background Environment Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-1000" 
        style={{ 
          backgroundImage: `url(${charMeta.backgroundPath})`,
          opacity: 0.12 
        }}
      />

      {/* Sticky Header — sticky position works reliably when ancestor does not have overflow-x: hidden */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface-variant p-3 md:px-6 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/choose-friend")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary"
            aria-label="Back to character selection"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/30 shadow-sm">
            <img src={charMeta.imagePath} alt={charMeta.displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-on-surface leading-tight">{charMeta.displayName} Roadmap</h1>
            <p className="text-xs text-on-surface-variant">{completedCount}/5 Tier-1 lessons completed</p>
          </div>
        </div>

        {/* Quick Tier 2 Jump Indicator */}
        {isTier2Unlocked && (
          <button
            onClick={() => {
              const el = document.getElementById("tier-2-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <span>Tier 2 Unlocked!</span>
          </button>
        )}
      </header>

      {/* Roadmap Path */}
      <main className="max-w-lg mx-auto pt-6 px-4 flex flex-col items-center relative z-10 overflow-x-clip">
        
        {/* Tier 1 Section Header Badge */}
        <div className="text-center mb-8 bg-surface/95 backdrop-blur-md px-6 py-2 rounded-full border-2 border-primary/20 text-primary font-extrabold text-[13px] tracking-widest uppercase shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Tier 1: Foundational Skills</span>
        </div>

        {/* Tier 1 Winding Candy-Crush Path */}
        <div className="w-full flex flex-col items-center relative py-2">
          {visibleTier1Lessons.map((lesson, index) => {
            const isCompleted = progress?.completedLessons.includes(lesson.id);
            const isAvailable = isCompleted || index === 0 || progress?.completedLessons.includes(visibleTier1Lessons[index - 1]?.id);
            const stars = progress?.lessonStars[lesson.id] || 0;

            // Candy Crush Alternating Winding Offset
            const xPositions = [0, -75, 75, -80, 80, 0];
            const startX = xPositions[index % xPositions.length];
            const nextX = index === visibleTier1Lessons.length - 1 ? 0 : xPositions[(index + 1) % xPositions.length];

            let stateClass = "";
            let nodeIcon = "";
            if (isCompleted) {
              stateClass = "bg-primary text-on-primary ring-4 ring-primary-container shadow-lg shadow-primary/30";
              nodeIcon = "check";
            } else if (isAvailable) {
              stateClass = "bg-secondary text-on-secondary ring-4 ring-secondary-container shadow-xl shadow-secondary/40 animate-pulse";
              nodeIcon = "play_arrow";
            } else {
              stateClass = "bg-surface-container-high text-on-surface-variant opacity-75 border-2 border-outline-variant";
              nodeIcon = "lock";
            }

            return (
              <div key={lesson.id} className="relative flex flex-col items-center w-full pb-8">
                {/* Smooth Candy-Crush Connecting Curve to Next Node */}
                <svg
                  className="absolute top-[32px] left-1/2 -translate-x-1/2 w-[340px] h-[130px] -z-10 pointer-events-none"
                  viewBox="0 0 340 130"
                  fill="none"
                >
                  <path
                    d={`M ${170 + startX} 0 C ${170 + startX} 70, ${170 + nextX} 60, ${170 + nextX} 130`}
                    stroke="currentColor"
                    className={isCompleted ? "text-primary" : isAvailable ? "text-secondary" : "text-outline-variant"}
                    strokeWidth={isCompleted || isAvailable ? "6" : "4"}
                    strokeDasharray={isCompleted ? "none" : "8 8"}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Stepping Stone Node */}
                <div
                  className="flex flex-col items-center gap-2 relative z-10 transition-transform duration-300 hover:scale-110 active:scale-95"
                  style={{ transform: `translateX(${startX}px)` }}
                >
                  <button
                    disabled={!isAvailable}
                    onClick={() => router.push(`/session?character=${charMeta.backendName}&lessonId=${lesson.id}&tier=1`)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${stateClass} ${
                      !isAvailable ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {nodeIcon}
                    </span>
                  </button>

                  {/* Node Information Card */}
                  <div className="text-center bg-surface/95 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-outline-variant/60 shadow-md min-w-[105px]">
                    <h3 className={`font-bold text-[13px] ${isAvailable ? "text-on-surface" : "text-on-surface-variant"}`}>
                      Lesson {index + 1}
                    </h3>
                    <p className="text-[11px] font-medium text-on-surface-variant truncate max-w-[120px]">
                      {lesson.lesson || "Everyday Talk"}
                    </p>
                    {isCompleted && stars > 0 && (
                      <div className="flex justify-center text-primary mt-1">
                        {Array.from({ length: stars }).map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            star
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional: Show remaining Tier 1 lessons toggle if there are more than 5 */}
        {tier1Lessons.length > 5 && (
          <div className="my-2 z-10">
            <button
              onClick={() => setShowAllTier1(!showAllTier1)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/60 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showAllTier1 ? "expand_less" : "expand_more"}
              </span>
              <span>
                {showAllTier1
                  ? "Show Only 5 Core Lessons"
                  : `Show All ${tier1Lessons.length} Tier-1 Lessons (+${tier1Lessons.length - 5} more)`}
              </span>
            </button>
          </div>
        )}

        {/* ↓ Tier 2 Scroll Cue — visual path indicator between Tier 1 end and Tier 2 */}
        <div className="flex flex-col items-center my-4 gap-1.5 relative z-10">
          {/* Dashed path line */}
          <div className="w-px h-10 border-l-2 border-dashed border-outline-variant/60" />
          {/* Tier 2 badge */}
          <div className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 text-[13px] font-extrabold tracking-widest uppercase shadow-sm transition-all ${
            isTier2Unlocked
              ? "bg-tertiary-container border-tertiary text-tertiary"
              : "bg-surface/80 border-outline-variant text-on-surface-variant backdrop-blur-sm"
          }`}>
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isTier2Unlocked ? "'FILL' 1" : "'FILL' 0" }}>
              {isTier2Unlocked ? "psychology" : "lock"}
            </span>
            <span>Tier 2</span>
          </div>
          {/* Animated down arrows */}
          <div className="flex flex-col items-center gap-0.5 animate-bounce">
            <span className="material-symbols-outlined text-[18px] text-outline-variant">expand_more</span>
          </div>
        </div>

        {/* Tier 2 Milestone Unlock Banner */}
        <div id="tier-2-section" className="w-full mt-4 mb-10 relative z-10 px-2 scroll-mt-20">
          <div
            className={`p-6 rounded-[32px] text-center border-2 shadow-md transition-all bg-surface/95 backdrop-blur-md ${
              isTier2Unlocked
                ? "border-tertiary bg-tertiary-container/20 text-on-surface"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            <div className="flex justify-center mb-3">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isTier2Unlocked ? "bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/30" : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isTier2Unlocked ? "psychology" : "lock"}
                </span>
              </div>
            </div>
            <h2 className="text-[20px] font-extrabold mb-1 text-on-surface">
              {isTier2Unlocked ? "Tier 2: Interactive Conversations Unlocked!" : "Tier 2: Conversation Milestone"}
            </h2>
            <p className="text-[13px] font-medium text-on-surface-variant max-w-xs mx-auto">
              {isTier2Unlocked
                ? "Experience multi-turn dynamic dialogues with contextual feedback."
                : `Complete ${Math.max(0, 5 - completedCount)} more Tier 1 lessons to unlock live conversation mode.`}
            </p>
          </div>
        </div>

        {/* Tier 2 Lessons Winding Candy-Crush Path */}
        {isTier2Unlocked && tier2Lessons.length > 0 && (
          <div className="w-full flex flex-col items-center relative py-2 mb-8">
            <div className="text-center mb-8 bg-surface/95 backdrop-blur-md px-6 py-2 rounded-full border-2 border-tertiary/30 text-tertiary font-extrabold text-[13px] tracking-widest uppercase shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">forum</span>
              <span>Tier 2: Multi-Turn Conversations</span>
            </div>

            {tier2Lessons.map((lesson, idx) => {
              const isCompleted = progress?.completedLessons.includes(lesson.id);
              const stars = progress?.lessonStars[lesson.id] || 0;
              const xPositions = [0, 80, -80, 75, -75];
              const startX = xPositions[idx % xPositions.length];
              const nextX = idx === tier2Lessons.length - 1 ? 0 : xPositions[(idx + 1) % xPositions.length];

              return (
                <div key={lesson.id} className="relative flex flex-col items-center w-full pb-8">
                  {/* Smooth Candy-Crush Connecting Curve between Tier 2 Nodes */}
                  {idx < tier2Lessons.length - 1 && (
                    <svg
                      className="absolute top-[32px] left-1/2 -translate-x-1/2 w-[340px] h-[130px] -z-10 pointer-events-none"
                      viewBox="0 0 340 130"
                      fill="none"
                    >
                      <path
                        d={`M ${170 + startX} 0 C ${170 + startX} 70, ${170 + nextX} 60, ${170 + nextX} 130`}
                        stroke="currentColor"
                        className={isCompleted ? "text-tertiary" : "text-secondary"}
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}

                  {/* Stepping Stone Node */}
                  <div
                    className="flex flex-col items-center gap-2 relative z-10 transition-transform duration-300 hover:scale-110 active:scale-95"
                    style={{ transform: `translateX(${startX}px)` }}
                  >
                    <button
                      onClick={() => router.push(`/session?character=${charMeta.backendName}&lessonId=${lesson.id}&tier=2`)}
                      className={`w-16 h-16 rounded-full font-extrabold text-[20px] shadow-xl flex items-center justify-center transition-all border-4 ${
                        isCompleted
                          ? "bg-tertiary text-on-tertiary border-tertiary-container ring-4 ring-tertiary/20"
                          : "bg-primary text-on-primary border-primary-container ring-4 ring-primary/20 animate-gentle-pulse"
                      }`}
                    >
                      {idx + 1}
                    </button>

                    <div className="text-center bg-surface/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-outline-variant/60 shadow-md min-w-[130px] max-w-[180px]">
                      <h3 className="font-bold text-[13px] text-on-surface">Conversation {idx + 1}</h3>
                      <p className="text-[11px] font-medium text-on-surface-variant truncate mt-0.5">{lesson.skill}</p>
                      {isCompleted && stars > 0 && (
                        <div className="flex justify-center text-primary mt-1">
                          {Array.from({ length: stars }).map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
