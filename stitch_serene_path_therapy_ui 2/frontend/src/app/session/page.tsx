"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function YourSession() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [progress, setProgress] = useState(33); // starting at 33%

  const handlePlayAudio = () => {
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
    }, 1500);
  };

  const handleMicTap = () => {
    setIsListening(true);
    
    // Simulate listening for 2 seconds, then showing success feedback
    setTimeout(() => {
      setIsListening(false);
      setShowFeedback(true);
      setProgress(66); // advance progress
      
      // Auto advance to "Great Job" screen after a delay
      setTimeout(() => {
        router.push("/session/complete");
      }, 2000);
    }, 2000);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans overflow-hidden antialiased">
      {/* Top Navigation App Bar */}
      <header className="w-full h-16 flex justify-between items-center px-6 md:px-20 shrink-0 relative z-10 mt-safe">
        <button 
          onClick={() => router.push("/choose-friend")}
          className="w-16 h-16 flex items-center justify-center text-primary rounded-full hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm bg-surface"
        >
          <span className="material-symbols-outlined text-[32px]">close</span>
        </button>
        
        {/* Progress Bar at the very top */}
        <div className="flex-1 mx-8 max-w-2xl h-3 bg-surface-container-high rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <button className="w-16 h-16 flex items-center justify-center text-primary rounded-full hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm bg-surface">
          <span className="material-symbols-outlined text-[32px]">help_outline</span>
        </button>
      </header>

      {/* Main Content Canvas - Singular, Fixed Layout */}
      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-6 pb-safe h-full relative z-0">
        
        {/* Top Zone: Avatar & System Message */}
        <section className="flex-1 flex flex-col justify-end items-center text-center pb-8 min-h-[30vh]">
          <div className="w-32 h-32 mb-6 rounded-full overflow-hidden bg-surface-container-high border-4 border-surface shadow-ambient">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              className="w-full h-full object-cover" 
              alt="Soft, friendly avatar of a gentle animal" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC13z3BqOe3kQE5wDBsBoC587sZcWyfZ333896mrN4CyirrZCSdeNMI2X4jiXSUVbLZ5qvOjEbZOuOboE0FmNIamGplfSV3qAfQdSmUYt4aC0iffUnjZu25p1sOvjWp4J0nD_iU4zBX4GoahZMmH7IxREw7unVmD3DRScF55X45wUQUygMGLsuRsABe0BWgVKMWJa97Xf23_xQQxW_32hdtXYWbwoJXzfR28nA9a7nn1M13ol_3zaXzYg"
            />
          </div>
          
          <div className="flex items-center gap-4 bg-surface-container px-6 py-4 rounded-xl shadow-sm">
            <h1 className="text-[24px] font-semibold leading-[32px] text-on-surface tracking-[0.02em]">
              Can you say &quot;Hello&quot;?
            </h1>
            <button 
              onClick={handlePlayAudio}
              className={`w-[48px] h-[48px] flex items-center justify-center bg-primary text-on-primary rounded-full hover:bg-surface-tint active:scale-95 transition-all shadow-sm ${isPlaying ? 'scale-110' : ''}`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                volume_up
              </span>
            </button>
          </div>
        </section>

        {/* Middle Zone: Microphone Interaction */}
        <section className="flex-1 flex flex-col justify-center items-center relative min-h-[40vh]">
          {/* Decorative animated rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isListening ? (
              <>
                <div className="absolute w-64 h-64 bg-primary-container rounded-full pulse-ring"></div>
                <div className="absolute w-80 h-80 bg-primary-container rounded-full pulse-ring" style={{ animationDelay: '1.5s' }}></div>
              </>
            ) : null}
          </div>
          
          {/* Huge Tap Target Microphone */}
          <button 
            onClick={handleMicTap}
            className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center shadow-ambient hover:shadow-lg active:scale-95 transition-all duration-300 ${
              isListening ? 'bg-primary-container text-primary' : 'bg-primary text-on-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              mic
            </span>
          </button>
          <p className="mt-8 text-[16px] font-semibold tracking-[0.04em] text-on-surface-variant z-10 bg-surface/80 px-4 py-2 rounded-full backdrop-blur-sm">
            {isListening ? "Listening..." : "Tap to speak"}
          </p>
          
          {/* Secondary Text Toggle (Optional fallback) */}
          {!isListening && (
            <button className="mt-4 px-6 py-3 border-2 border-secondary text-secondary rounded-full text-[16px] font-semibold hover:bg-secondary-container/50 transition-colors z-10">
              I prefer to type
            </button>
          )}
        </section>

        {/* Bottom Zone: Feedback Strip */}
        <section className="h-32 flex items-center justify-center shrink-0">
          {showFeedback && (
            <div className="flex items-center gap-3 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full shadow-md animate-in slide-in-from-bottom duration-500">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="text-[24px] font-semibold leading-[32px]">Nice work!</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
