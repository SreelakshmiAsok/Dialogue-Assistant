"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WelcomeHome() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      router.push("/choose-friend");
    }, 200);
  };

  const handlePlayAudio = () => {
    setIsPlaying(true);
    // In a real app, play audio here
    setTimeout(() => {
      setIsPlaying(false);
    }, 300);
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-soft-gradient font-sans">
      {/* Top AppBar */}
      <header className="absolute top-0 right-0 p-6 md:p-12 z-50">
        <button
          aria-label="Adult Settings"
          className="w-16 h-16 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95 text-primary"
          onClick={() => router.push("/settings")}
        >
          <span className="material-symbols-outlined text-[32px]">settings</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 md:px-20">
        <div className="flex flex-col items-center justify-center space-y-12 max-w-2xl mx-auto text-center w-full">
          
          {/* Avatar Area */}
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-surface-container flex items-center justify-center mb-8 shadow-ambient relative overflow-hidden">
            {/* We use an img tag instead of next/image here just to keep the original external URL without configuring next.config.js for domains right now */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              className="w-full h-full object-cover mix-blend-multiply opacity-80" 
              alt="Friendly geometric shape illustration" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQLiw0SJaHkAwtV0rqv2e_weMXzYHT-hbfu0EWQq6hevpv9-DIPY4EfuKqwi9Ypy_IVm6WgSrkorU4wKi5cG97AuAnLGVGBsUpcselkw8UXMmkGC9Sxj93H76B7BajOdqZzrVKEcvo4nZ54XL8rv7HDHsbrA5HnWUFrqhFfmbzYj4HeeF9_RzlonDXBp1R-B-fuhVFCt2wUDEcRuTBrTQ9_R9PKjmtrmYKWH8n55cTz64Bu94EtYel8A"
            />
          </div>

          {/* Greeting Text & Audio Feedback */}
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-[32px] leading-[44px] md:text-[48px] md:leading-[64px] font-bold tracking-[0.02em] text-on-surface flex items-center gap-4">
              Hello!
              <button 
                aria-label="Play Greeting Audio" 
                onClick={handlePlayAudio}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed transition-colors active:scale-95"
              >
                <span 
                  className={`material-symbols-outlined text-[28px] transition-transform duration-300 ${isPlaying ? 'scale-125' : ''}`} 
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  volume_up
                </span>
              </button>
            </h1>
            <p className="text-[24px] leading-[36px] font-semibold text-on-surface-variant max-w-md">
              Ready to play?
            </p>
          </div>

          {/* Primary Action Button */}
          <button 
            onClick={handleStart}
            className={`mt-12 w-64 h-[80px] text-[24px] font-semibold rounded-[24px] shadow-ambient active-sink transition-all animate-gentle-pulse flex items-center justify-center gap-3 ${
              isStarting ? 'bg-primary-container text-on-primary-container' : 'bg-primary text-on-primary'
            }`}
          >
            <span>Start</span>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </button>
        </div>
      </main>
    </div>
  );
}
