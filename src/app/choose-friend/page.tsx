"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CHARACTERS } from "@/lib/characters";

export default function ChooseAFriend() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("father");

  const handleContinue = () => {
    const char = CHARACTERS.find((c) => c.id === selectedId);
    if (char) {
      router.push(`/session?character=${char.backendName}`);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <main className="min-h-screen flex flex-col items-center justify-center relative px-6 md:px-20 py-safe pb-32">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 md:top-12 md:left-12 w-14 h-14 flex items-center justify-center rounded-full bg-surface-container text-primary hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm z-50"
        >
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>

        <header className="text-center mb-12 w-full max-w-4xl mx-auto flex flex-col items-center gap-2 mt-8">
          <h1 className="text-[32px] leading-[44px] md:text-[48px] md:leading-[64px] font-bold text-primary">
            Choose a Character 🎭
          </h1>
          <p className="text-[20px] leading-[32px] text-on-surface-variant max-w-2xl">
            Pick who you want to practice speaking with today
          </p>
        </header>

        {/* Character Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mx-auto">
          {CHARACTERS.map((char) => {
            const isSelected = selectedId === char.id;
            return (
              <button
                key={char.id}
                aria-label={`Select ${char.displayName}`}
                onClick={() => setSelectedId(char.id)}
                className={`group flex flex-col items-center justify-center p-5 rounded-[32px] transition-all duration-300 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary-container focus:ring-offset-4 focus:ring-offset-background hover:bg-surface-container-high relative
                  ${isSelected ? 'bg-surface-container-high ring-4 ring-primary shadow-glow' : 'bg-surface-container'}
                `}
              >
                {/* Character Image */}
                <div className={`w-full aspect-square mb-4 relative overflow-hidden rounded-[24px] border-4 transition-colors ${
                  isSelected ? 'border-primary' : 'border-transparent group-focus:border-primary group-hover:border-outline-variant'
                }`}>
                  <img
                    className="w-full h-full object-cover"
                    alt={char.displayName}
                    src={char.imagePath}
                  />
                </div>

                {/* Name */}
                <span className={`text-[22px] font-bold leading-[28px] ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                  {char.displayName}
                </span>

                {/* Subtitle */}
                <span className="text-[14px] font-medium text-on-surface-variant mt-1">
                  {char.subtitle}
                </span>

                {/* Difficulty Badge */}
                <span className={`mt-3 px-4 py-1.5 rounded-full text-[13px] font-bold ${
                  char.difficulty === 'easy' ? 'bg-secondary-container text-on-secondary-container' :
                  char.difficulty === 'medium' ? 'bg-tertiary-container text-on-tertiary-container' :
                  'bg-error-container text-on-error-container'
                }`}>
                  {char.difficultyLabel}
                </span>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-primary text-on-primary rounded-full p-2 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Fixed Continue Button */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md p-6 border-t border-surface-variant flex justify-center z-50">
        <button 
          onClick={handleContinue}
          className="w-full max-w-md h-[64px] bg-primary text-on-primary text-[24px] font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-surface-tint active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-surface shadow-sm"
        >
          Continue
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
