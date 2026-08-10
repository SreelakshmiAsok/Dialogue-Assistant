"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionComplete() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayReward = () => {
    setIsPlaying(true);
    // In a real app, play audio here
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans antialiased overflow-hidden">
      <main className="w-full h-full min-h-screen max-w-2xl mx-auto px-6 md:px-20 flex flex-col items-center justify-center text-center space-y-12">
        
        {/* Reward Area */}
        <div className="flex flex-col items-center justify-center space-y-8 mt-[-10vh]">
          {/* Large Static Reward Icon */}
          <div className="w-48 h-48 rounded-full bg-primary-container flex items-center justify-center shadow-lg animate-float">
            <span 
              className="material-symbols-outlined text-[96px] text-primary" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
          
          {/* Encouraging Text */}
          <div className="space-y-4 max-w-md">
            <h1 className="text-[32px] leading-[44px] md:text-[48px] md:leading-[64px] font-bold text-primary tracking-[0.02em]">
              Great Job!
            </h1>
            <p className="text-[20px] leading-[32px] text-on-surface-variant max-w-sm mx-auto">
              You finished the lesson peacefully and carefully.
            </p>
          </div>
        </div>

        {/* Audio Feedback Button */}
        <button 
          onClick={handlePlayReward}
          className="flex items-center justify-center space-x-3 bg-surface-container-high hover:bg-surface-variant transition-colors rounded-full px-8 h-16 text-on-surface group active:scale-95 shadow-sm"
        >
          <span 
            className={`material-symbols-outlined text-secondary transition-transform duration-300 ${isPlaying ? 'scale-125' : 'group-hover:scale-110'}`} 
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            volume_up
          </span>
          <span className="text-[24px] font-semibold">Hear Reward</span>
        </button>

        {/* Actions */}
        <div className="w-full max-w-md flex flex-col space-y-4 pt-8">
          {/* Primary Action */}
          <button 
            onClick={() => router.push("/session")}
            className="w-full h-16 bg-primary text-on-primary rounded-full text-[24px] font-semibold hover:bg-surface-tint shadow-md active:shadow-none active:translate-y-1 transition-all"
          >
            Play Again
          </button>
          
          {/* Secondary Action */}
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-full h-16 border-4 border-secondary text-secondary rounded-full text-[24px] font-semibold hover:bg-secondary-container transition-colors active:scale-95"
          >
            Finish
          </button>
        </div>
      </main>
    </div>
  );
}
