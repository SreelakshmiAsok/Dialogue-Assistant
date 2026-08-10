"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WelcomeHome() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      router.push("/choose-friend");
    }, 200);
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-soft-gradient font-sans">
      {/* Sky background */}
      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: "url(/images/sky_clouds_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Top AppBar */}
      <header className="absolute top-0 right-0 p-6 md:p-12 z-50">
        <button
          aria-label="Adult Settings"
          className="w-16 h-16 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95 text-primary"
          onClick={() => router.push("/parent-access")}
        >
          <span className="material-symbols-outlined text-[32px]">settings</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 md:px-20 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-12 max-w-2xl mx-auto text-center w-full">
          
          {/* Avatar Area */}
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-surface-container flex items-center justify-center mb-4 shadow-ambient relative overflow-hidden border-4 border-primary-container">
            <img 
              className="w-full h-full object-cover" 
              alt="SocialBuddy mascot" 
              src="/images/sky_clouds_bg.png"
            />
          </div>

          {/* Greeting Text */}
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-[36px] leading-[48px] md:text-[56px] md:leading-[72px] font-bold tracking-[0.02em] text-on-surface">
              Hello! 👋
            </h1>
            <p className="text-[24px] leading-[36px] font-semibold text-on-surface-variant max-w-md">
              Ready to practice talking?
            </p>
            <p className="text-[18px] leading-[28px] text-on-surface-variant/70 max-w-sm">
              Pick a friend and start your social skills session
            </p>
          </div>

          {/* Primary Action Button */}
          <button 
            onClick={handleStart}
            className={`mt-8 w-72 h-[84px] text-[26px] font-semibold rounded-[28px] shadow-ambient active-sink transition-all animate-gentle-pulse flex items-center justify-center gap-3 ${
              isStarting ? 'bg-primary-container text-on-primary-container' : 'bg-primary text-on-primary'
            }`}
          >
            <span>Start Playing</span>
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </button>
        </div>
      </main>
    </div>
  );
}
