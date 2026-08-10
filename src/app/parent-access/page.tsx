"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ParentAccess() {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Generate a simple math problem
  const [num1] = useState(() => Math.floor(Math.random() * 6) + 2);
  const [num2] = useState(() => Math.floor(Math.random() * 6) + 2);
  const correctAnswer = num1 + num2;

  const handleVerify = useCallback(() => {
    if (parseInt(answer) === correctAnswer) {
      setError(false);
      router.push("/dashboard");
    } else {
      setError(true);
      setAnswer("");
    }
  }, [answer, correctAnswer, router]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans antialiased">
      {/* Cancel button */}
      <header className="p-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-[16px] font-semibold"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          Cancel
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="bg-surface-container-lowest rounded-[32px] shadow-ambient p-8 md:p-12 max-w-md w-full text-center">
          {/* Shield icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>

          <h1 className="text-[28px] md:text-[36px] font-bold text-on-surface mb-3">
            For Parents
          </h1>
          <p className="text-[16px] md:text-[18px] text-on-surface-variant leading-[28px] mb-8">
            Please solve this simple math problem to access account settings.
          </p>

          {/* Math Problem Card */}
          <div className="bg-surface-container rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-4">
              <span className="text-[48px] font-bold text-on-surface">{num1}</span>
              <span className="text-[36px] font-medium text-on-surface-variant">+</span>
              <span className="text-[48px] font-bold text-primary">{num2}</span>
              <span className="text-[36px] font-medium text-on-surface-variant">=</span>
              <input
                type="number"
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-[72px] h-[72px] text-[36px] font-bold text-center bg-surface-container-lowest border-2 border-outline-variant rounded-2xl text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="?"
                autoFocus
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              className="mt-6 w-full h-[56px] bg-primary text-on-primary rounded-2xl text-[18px] font-bold flex items-center justify-center gap-2 hover:bg-surface-tint active:scale-95 transition-all shadow-sm"
            >
              Verify
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 mb-4 text-[15px] font-semibold">
              ❌ Incorrect answer. Please try again.
            </div>
          )}

          {/* Explanation Link */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center justify-center gap-2 mx-auto text-on-surface-variant hover:text-on-surface text-[15px] font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">help_outline</span>
            Why is this here?
          </button>

          {showExplanation && (
            <p className="mt-3 text-[14px] text-on-surface-variant leading-[22px] bg-surface-container rounded-xl p-4">
              This simple verification prevents children from accidentally accessing parent settings and controls. Only an adult who can solve this math problem will be granted access.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
