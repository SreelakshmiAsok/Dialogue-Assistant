"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCharacterByBackendName } from "@/lib/characters";
import { saveLessonCompletion } from "@/lib/progress";

function SessionCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);

  const stars = parseInt(searchParams.get("stars") || "0");
  const correct = parseInt(searchParams.get("correct") || "0");
  const total = parseInt(searchParams.get("total") || "0");
  const characterName = searchParams.get("character") || "Father";
  const lessonId = searchParams.get("lessonId");
  const tier = searchParams.get("tier");
  
  const charMeta = getCharacterByBackendName(characterName);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  useEffect(() => {
    // Save progress to local roadmap
    if (lessonId && characterName) {
      saveLessonCompletion(characterName, lessonId, stars);
    }

    if ("speechSynthesis" in window) {
      const messages = [
        "Great job! You did amazing today!",
        "Wonderful work! You are a superstar!",
        "You practiced so well! Keep it up!",
      ];
      const utterance = new SpeechSynthesisUtterance(messages[Math.floor(Math.random() * messages.length)]);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, [lessonId, characterName, stars]);

  // Determine celebration level
  const getMessage = () => {
    if (accuracy >= 80) return { title: "Amazing!", subtitle: "You're a social skills superstar!" };
    if (accuracy >= 50) return { title: "Great Job!", subtitle: "You're learning so well! Keep practicing!" };
    return { title: "Good Try!", subtitle: "Every practice makes you better!" };
  };

  const msg = getMessage();

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans antialiased overflow-hidden">
      <main className="w-full h-full min-h-screen max-w-2xl mx-auto px-6 md:px-20 flex flex-col items-center justify-center text-center space-y-8">
        
        {/* Character Avatar */}
        {charMeta && (
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary-container shadow-ambient">
            <img src={charMeta.imagePath} alt={charMeta.displayName} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Reward Area */}
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Large Star Icon */}
          <div className="w-40 h-40 rounded-full bg-primary-container flex items-center justify-center shadow-lg animate-float">
            <span 
              className="material-symbols-outlined text-[80px] text-primary" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
          
          {/* Encouraging Text */}
          <div className="space-y-3 max-w-md">
            <h1 className="text-[36px] leading-[48px] md:text-[52px] md:leading-[68px] font-bold text-primary tracking-[0.02em]">
              {msg.title}
            </h1>
            <p className="text-[20px] leading-[32px] text-on-surface-variant max-w-sm mx-auto">
              {msg.subtitle}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center">
            <span className="material-symbols-outlined text-[28px] text-primary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-[28px] font-bold text-on-surface">{stars}</span>
            <span className="text-[13px] font-semibold text-on-surface-variant">Stars</span>
          </div>
          <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center">
            <span className="material-symbols-outlined text-[28px] text-secondary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-[28px] font-bold text-on-surface">{correct}/{total}</span>
            <span className="text-[13px] font-semibold text-on-surface-variant">Correct</span>
          </div>
          <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center">
            <span className="material-symbols-outlined text-[28px] text-tertiary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>percent</span>
            <span className="text-[28px] font-bold text-on-surface">{accuracy}%</span>
            <span className="text-[13px] font-semibold text-on-surface-variant">Accuracy</span>
          </div>
        </div>

        {/* Auto-playing reward audio */}

        {/* Actions */}
        <div className="w-full max-w-md flex flex-col space-y-3 pt-4">
          <button 
            onClick={() => router.push(`/session?character=${characterName}&lessonId=${lessonId || ''}&tier=${tier || 1}`)}
            className="w-full h-16 bg-primary text-on-primary rounded-full text-[22px] font-semibold hover:bg-surface-tint shadow-md active:shadow-none active:translate-y-1 transition-all"
          >
            Play Again
          </button>
          
          <button 
            onClick={() => router.push(`/roadmap/${characterName}`)}
            className="w-full h-16 border-3 border-secondary text-secondary rounded-full text-[22px] font-semibold hover:bg-secondary-container transition-colors active:scale-95"
            style={{ borderWidth: '3px' }}
          >
            <span className="material-symbols-outlined mr-2 align-middle">map</span>
            Back to Roadmap
          </button>

          <button 
            onClick={() => router.push("/choose-friend")}
            className="w-full h-14 text-on-surface-variant text-[18px] font-semibold hover:text-on-surface transition-colors active:scale-95"
          >
            🎭 Choose Another Character
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SessionComplete() {
  return (
    <Suspense fallback={
      <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-sans">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SessionCompleteContent />
    </Suspense>
  );
}
