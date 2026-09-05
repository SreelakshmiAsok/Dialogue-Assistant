"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CHARACTERS } from "@/lib/characters";
import { getCharacterProgress } from "@/lib/progress";

export default function ChooseAFriend() {
  const router = useRouter();
  const [progressData, setProgressData] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load progress for all characters on mount
    const newProgress: Record<string, number> = {};
    CHARACTERS.forEach((char) => {
      const prog = getCharacterProgress(char.backendName);
      newProgress[char.id] = prog.completedLessons.length;
    });
    setProgressData(newProgress);
  }, []);

  const handleSelectCharacter = (backendName: string) => {
    router.push(`/roadmap/${backendName}`);
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <main className="min-h-screen flex flex-col items-center justify-center relative px-6 md:px-20 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 md:top-10 md:left-12 w-14 h-14 flex items-center justify-center rounded-full bg-surface-container text-primary hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm z-50"
          aria-label="Back to home"
        >
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>

        <header className="text-center mb-10 w-full max-w-4xl mx-auto flex flex-col items-center gap-2 mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container/60 text-on-primary-container text-[13px] font-bold mb-2">
            <span className="material-symbols-outlined text-[18px]">explore</span>
            <span>Choose Your Companion</span>
          </div>
          <h1 className="text-[32px] leading-[44px] md:text-[48px] md:leading-[64px] font-bold text-on-surface">
            Who would you like to speak with?
          </h1>
          <p className="text-[18px] leading-[30px] md:text-[20px] text-on-surface-variant max-w-2xl">
            Tap any character below to open their learning roadmap and begin practicing.
          </p>
        </header>

        {/* Character Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto">
          {CHARACTERS.map((char) => {
            const completedCount = progressData[char.id] || 0;
            const progressText = `${completedCount}/5 lessons completed`;
            
            return (
              <button
                key={char.id}
                aria-label={`Open roadmap for ${char.displayName}`}
                onClick={() => handleSelectCharacter(char.backendName)}
                className="group flex flex-col items-center p-6 rounded-[32px] transition-all duration-300 active:scale-95 bg-surface-container hover:bg-surface-container-high hover:-translate-y-1.5 shadow-sm hover:shadow-xl border-2 border-transparent hover:border-primary/40 relative text-center"
              >
                {/* Character Image */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 mb-4 relative overflow-hidden rounded-full border-4 border-surface group-hover:border-primary shadow-ambient transition-all group-hover:scale-105">
                  <img
                    className="w-full h-full object-cover"
                    alt={char.displayName}
                    src={char.imagePath}
                  />
                </div>

                {/* Name */}
                <span className="text-[22px] font-bold leading-[28px] text-on-surface group-hover:text-primary transition-colors">
                  {char.displayName}
                </span>

                {/* Subtitle */}
                <span className="text-[14px] font-medium text-on-surface-variant mt-1 mb-4">
                  {char.subtitle}
                </span>

                {/* Roadmap Progress Badge */}
                <span className={`mt-auto px-4 py-2 rounded-full text-[13px] font-bold transition-colors flex items-center gap-1.5 ${
                  completedCount >= 5 
                    ? 'bg-primary text-on-primary' 
                    : 'bg-surface-container-highest text-on-surface'
                }`}>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {completedCount >= 5 ? 'verified' : 'timeline'}
                  </span>
                  <span>{progressText}</span>
                </span>

                {/* Tap to enter hint */}
                <span className="mt-3 text-[12px] font-bold text-primary group-hover:underline flex items-center gap-1">
                  <span>Enter Roadmap</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

