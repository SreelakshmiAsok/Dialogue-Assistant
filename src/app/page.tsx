"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRole } from "@/lib/auth";

export default function WelcomeHome() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      const token = getToken();
      const role = getRole();
      if (!token) {
        router.push("/login");
      } else if (role === "parent") {
        router.push("/profiles");
      } else {
        router.push("/choose-friend");
      }
    }, 180);
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background text-on-background font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Background Soft Gradients & Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-25 pointer-events-none transition-opacity"
        style={{
          backgroundImage: "url(/images/sky_clouds_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-container/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary-container/40 blur-3xl pointer-events-none" />

      {/* Top Header / App Bar */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-md">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
          </div>
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-primary leading-tight">Navil</h2>
            <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Social Skills Assistant</p>
          </div>
        </div>

        <button
          aria-label="Parent and Educator Dashboard"
          onClick={() => router.push("/parent-access")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-all text-on-surface font-semibold text-[14px] shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">admin_panel_settings</span>
          <span className="hidden sm:inline">Parent &amp; Educator</span>
        </button>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10 max-w-5xl mx-auto w-full text-center">
        {/* Welcome Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container/70 text-on-secondary-container text-[13px] font-bold mb-6 shadow-sm animate-bounce-gentle">
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          <span>Bilingual English &amp; Tamil Dialogue Practice</span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="text-[40px] leading-[50px] sm:text-[56px] sm:leading-[66px] md:text-[68px] md:leading-[78px] font-bold text-on-surface tracking-tight max-w-3xl">
          Welcome to <span className="text-primary font-extrabold">Navil</span>
        </h1>
        <p className="text-[18px] leading-[28px] sm:text-[22px] sm:leading-[34px] text-on-surface-variant max-w-2xl mt-4 font-medium">
          A gentle, speech-powered companion helping children practice everyday conversations, social etiquette, and confidence through fun roleplay.
        </p>

        {/* Primary Action Button */}
        <div className="mt-10 w-full max-w-sm">
          <button
            id="start-practicing-btn"
            onClick={handleStart}
            className={`w-full h-[72px] text-[22px] sm:text-[24px] font-bold rounded-full shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 ${
              isStarting ? "bg-primary-container text-on-primary-container scale-95" : "bg-primary text-on-primary hover:bg-surface-tint shadow-primary/25"
            }`}
          >
            <span>Start Practicing</span>
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_circle
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
