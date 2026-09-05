"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCharacterByBackendName } from "@/lib/characters";
import { saveLessonCompletion } from "@/lib/progress";
import { fetchQuestions } from "@/lib/api";

function SessionCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);

  const stars = parseInt(searchParams.get("stars") || "0");
  const correct = parseInt(searchParams.get("correct") || "0");
  const total = parseInt(searchParams.get("total") || "0");
  const characterName = searchParams.get("character") || "Father";
  const lessonId = searchParams.get("lessonId");
  const tier = searchParams.get("tier");

  const charMeta = getCharacterByBackendName(characterName);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const speakReward = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const shortMessages = ["Amazing job today!", "You are a superstar!", "Keep it up, great work!"];
      const utterance = new SpeechSynthesisUtterance(
        shortMessages[Math.floor(Math.random() * shortMessages.length)]
      );
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(
        (v) =>
          v.name.includes("Valluvar") ||
          v.name.toLowerCase().includes("david") ||
          v.name.toLowerCase().includes("mark") ||
          v.name.toLowerCase().includes("male")
      );
      if (maleVoice) utterance.voice = maleVoice;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  // Save progress and resolve the next lesson
  useEffect(() => {
    if (lessonId && characterName) {
      saveLessonCompletion(characterName, lessonId, stars);
    }

    // Resolve next lesson from the lesson list (Tier 1 only for now)
    if (tier === "1" || !tier) {
      fetchQuestions(characterName)
        .then((qs) => {
          const idx = qs.findIndex((q) => q.id === lessonId);
          if (idx !== -1 && idx < qs.length - 1) {
            setNextLessonId(qs[idx + 1].id);
          }
        })
        .catch(() => {});
    }

    if ("speechSynthesis" in window) {
      if (speechSynthesis.getVoices().length > 0) speakReward();
      else speechSynthesis.onvoiceschanged = speakReward;
    }
  }, [lessonId, characterName, stars]);

  const getMessage = () => {
    if (accuracy >= 80) return { title: "Amazing! 🎉", subtitle: "You're a social skills superstar!" };
    if (accuracy >= 50) return { title: "Great Job! 🌟", subtitle: "You're learning so well! Keep practicing!" };
    return { title: "Good Try! 💪", subtitle: "Every practice makes you better!" };
  };

  const msg = getMessage();

  const goToNextLesson = () => {
    if (nextLessonId) {
      router.push(`/session?character=${characterName}&lessonId=${nextLessonId}&tier=${tier || 1}`);
    }
  };

  return (
    <div className="bg-background text-on-background h-screen h-[100dvh] flex flex-col font-sans antialiased overflow-hidden">
      {/* Compact Header */}
      <header className="w-full h-14 shrink-0 flex items-center justify-between px-4 border-b border-surface-variant/40 bg-surface/80 backdrop-blur-md z-20">
        <button
          onClick={() => router.push(`/roadmap/${characterName}`)}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-[14px] font-semibold active:scale-95"
          aria-label="Back to roadmap"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="hidden sm:inline">Roadmap</span>
        </button>

        <div className="flex items-center gap-2">
          {charMeta && (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 shadow-sm">
              <img src={charMeta.imagePath} alt={charMeta.displayName} className="w-full h-full object-cover" />
            </div>
          )}
          <span className="text-[14px] font-bold text-on-surface">{charMeta?.displayName}</span>
        </div>

        <button
          onClick={speakReward}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-[13px] font-semibold hover:bg-secondary/20 transition-all active:scale-95"
          aria-label="Hear reward"
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
          <span className="hidden sm:inline">{isPlaying ? "Playing..." : "Hear Reward"}</span>
        </button>
      </header>

      {/* Main Content — fixed height, no scroll */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 min-h-0 gap-4 max-w-2xl mx-auto w-full">

        {/* Title + star icon */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shadow-md animate-float">
            <span
              className="material-symbols-outlined text-[32px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
          <h1 className="text-[26px] leading-[34px] md:text-[32px] md:leading-[42px] font-bold text-primary tracking-[0.02em]">
            {msg.title}
          </h1>
          <p className="text-[15px] leading-[22px] text-on-surface-variant max-w-sm">
            {msg.subtitle}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <div className="bg-surface-container rounded-2xl py-3 px-2 flex flex-col items-center">
            <span className="material-symbols-outlined text-[24px] text-primary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-[22px] font-bold text-on-surface">{stars}</span>
            <span className="text-[12px] font-semibold text-on-surface-variant">Stars</span>
          </div>
          <div className="bg-surface-container rounded-2xl py-3 px-2 flex flex-col items-center">
            <span className="material-symbols-outlined text-[24px] text-secondary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-[22px] font-bold text-on-surface">{correct}/{total}</span>
            <span className="text-[12px] font-semibold text-on-surface-variant">Correct</span>
          </div>
          <div className="bg-surface-container rounded-2xl py-3 px-2 flex flex-col items-center">
            <span className="material-symbols-outlined text-[24px] text-tertiary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>percent</span>
            <span className="text-[22px] font-bold text-on-surface">{accuracy}%</span>
            <span className="text-[12px] font-semibold text-on-surface-variant">Accuracy</span>
          </div>
        </div>

        {/* Play Again compact */}
        <button
          onClick={() => router.push(`/session?character=${characterName}&lessonId=${lessonId || ""}&tier=${tier || 1}`)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-surface-container text-on-surface text-[15px] font-semibold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>replay</span>
          Play Again
        </button>
      </main>

      {/* Bottom Action Bar — consistent format, balanced buttons */}
      <footer className="w-full shrink-0 p-4 flex items-center justify-between gap-3 max-w-2xl mx-auto">
        {/* Left: Back to Roadmap */}
        <button
          onClick={() => router.push(`/roadmap/${characterName}`)}
          className="h-12 px-5 rounded-full border-2 border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-[15px] flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">map</span>
          <span>Roadmap</span>
        </button>

        {/* Center: Switch Character */}
        <button
          onClick={() => router.push("/choose-friend")}
          className="h-12 px-5 rounded-full border-2 border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-[15px] flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">group</span>
          <span>Switch Character</span>
        </button>

        {/* Right: Next Lesson */}
        {nextLessonId ? (
          <button
            id="next-lesson-btn"
            onClick={goToNextLesson}
            className="h-12 px-6 rounded-full bg-primary text-on-primary hover:bg-surface-tint font-bold text-[15px] flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/20"
          >
            <span>Next Lesson</span>
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
          </button>
        ) : (
          <div className="w-[140px]" aria-hidden="true" />
        )}
      </footer>
    </div>
  );
}

export default function SessionComplete() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-sans">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SessionCompleteContent />
    </Suspense>
  );
}
