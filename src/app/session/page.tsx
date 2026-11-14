"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchQuestions, evaluateAnswer, getAudioUrl, getTtsAudioUrl } from "@/lib/api";
import { getCharacterByBackendName } from "@/lib/characters";
import { playSequence, stopAll } from "@/lib/audioManager";
import type { Question, EvaluationResult } from "@/lib/api";
import type { CharacterMeta } from "@/lib/characters";
import { fetchTier2Lessons, fetchTier2Lesson, evaluateTier2Turn } from "@/lib/api";
import type { Tier2LessonSummary, Tier2Lesson, Tier2EvaluationResult } from "@/lib/api";


function Tier1SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterName = searchParams.get("character") || "Father";

  const lessonId = searchParams.get("lessonId");
  const tier = searchParams.get("tier");

  const [charMeta, setCharMeta] = useState<CharacterMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sessionStars, setSessionStars] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sttText, setSttText] = useState("");

  // Refs for synchronous accumulation — avoids stale closure on final question nav
  const starsRef = useRef(0);
  const correctRef = useRef(0);

  // ---- Microphone lifecycle (turn-taking: computer speaks -> mic opens -> mic closes while processing)
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const evaluatingRef = useRef(false);
  const evaluationShownRef = useRef(false);
  const listenGenRef = useRef(0);
  const silentRoundsRef = useRef(0);
  const micBlockedRef = useRef(false);
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitRef = useRef<(answer: string) => void>(() => {});
  const [micNotice, setMicNotice] = useState("");

  // Turn the microphone OFF and invalidate any pending auto-listen. Safe to call at any time.
  const abortListening = useCallback(() => {
    listenGenRef.current++;
    if (listenTimerRef.current) {
      clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onstart = rec.onresult = rec.onerror = rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    }
    setIsListening(false);
  }, []);

  // Leaving Tier 1 (or the page) always releases the microphone and any audio.
  useEffect(() => {
    mountedRef.current = true;
    const onPageHide = () => abortListening();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("pagehide", onPageHide);
      abortListening();
      stopAll();
    };
  }, [abortListening]);

  // Silence: retry listening once, then stop and leave the manual mic button for the child.
  const handleSilence = useCallback((retry: () => void) => {
    silentRoundsRef.current += 1;
    if (silentRoundsRef.current < 2) {
      listenTimerRef.current = setTimeout(() => {
        listenTimerRef.current = null;
        if (mountedRef.current) retry();
      }, 500);
    } else {
      silentRoundsRef.current = 0;
      setMicNotice("Tap the microphone when you are ready to answer");
    }
  }, []);

  // Open the microphone. auto=true when triggered by the end of the computer's speech.
  const startListening = useCallback(
    (auto: boolean) => {
      if (!mountedRef.current || evaluatingRef.current || evaluationShownRef.current) return;
      if (recognitionRef.current) return; // never two microphone sessions
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setShowTextInput(true);
        return;
      }
      if (auto && micBlockedRef.current) return;
      if (!auto) {
        silentRoundsRef.current = 0;
        micBlockedRef.current = false;
      }
      stopAll(); // the microphone must never run while a voice is playing
      setMicNotice("");

      const gen = ++listenGenRef.current;
      const rec = new SpeechRecognitionAPI();
      rec.lang = "ta-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      let handled = false;
      const stale = () => gen !== listenGenRef.current || !mountedRef.current;

      rec.onstart = () => {
        if (stale()) return;
        setIsListening(true);
        setSttText("");
      };
      rec.onresult = (e: any) => {
        if (stale() || handled) return;
        handled = true;
        const transcript = e.results?.[0]?.[0]?.transcript?.trim();
        recognitionRef.current = null;
        setIsListening(false);
        if (!transcript) {
          handleSilence(() => startListeningRef.current(true));
          return;
        }
        silentRoundsRef.current = 0;
        setSttText(transcript);
        submitRef.current(transcript); // microphone is already off while the answer is processed
      };
      rec.onerror = (e: any) => {
        if (stale() || handled) return;
        handled = true;
        recognitionRef.current = null;
        setIsListening(false);
        const err = e?.error;
        if (err === "no-speech") {
          handleSilence(() => startListeningRef.current(true));
        } else if (err === "not-allowed" || err === "service-not-allowed") {
          micBlockedRef.current = true;
          setShowTextInput(true);
          setMicNotice("Microphone is blocked. You can type your answer instead.");
        } else if (err === "audio-capture" || err === "network") {
          micBlockedRef.current = true;
          setShowTextInput(true);
          setMicNotice("Microphone is not available. You can type your answer instead.");
        }
        // "aborted": we stopped it ourselves
      };
      rec.onend = () => {
        if (stale() || handled) return;
        handled = true;
        recognitionRef.current = null;
        setIsListening(false);
        handleSilence(() => startListeningRef.current(true)); // ended without a result = silence
      };
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch {
        recognitionRef.current = null;
        setIsListening(false);
      }
    },
    [handleSilence]
  );

  // Lets the recognition callbacks call the latest startListening (retry after silence)
  const startListeningRef = useRef<(auto: boolean) => void>(() => {});
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // After the computer has COMPLETELY finished speaking (playback "done"), open the mic once.
  const listenAfterSpeech = useCallback(
    (result: "done" | "cancelled" | "blocked") => {
      if (result !== "done" || !mountedRef.current) return;
      if (evaluatingRef.current || evaluationShownRef.current) return;
      if (listenTimerRef.current) clearTimeout(listenTimerRef.current);
      // short pause so the tail of the voice is not picked up by the microphone
      listenTimerRef.current = setTimeout(() => {
        listenTimerRef.current = null;
        if (mountedRef.current) startListening(true);
      }, 400);
    },
    [startListening]
  );

  // Speak a Tamil result/feedback line through the central audio manager (stops anything else first)
  const playTamilResult = useCallback((text?: string) => {
    if (!text || !/[\u0B80-\u0BFF]/.test(text)) return;
    playSequence([{ url: getTtsAudioUrl(text, "Result"), text }]);
  }, []);

  const currentQuestion = questions[currentIndex] || null;
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  // Load character and questions
  useEffect(() => {
    const meta = getCharacterByBackendName(characterName);
    setCharMeta(meta || null);

    fetchQuestions(characterName)
      .then((qs) => {
        if (lessonId) {
          setQuestions(qs.filter(q => q.id === lessonId));
        } else {
          setQuestions(qs);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [characterName, lessonId]);

  // Submit answer for evaluation
  const submitAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || !answer.trim()) return;
    if (evaluatingRef.current) return; // one answer at a time
    evaluatingRef.current = true;
    abortListening(); // microphone OFF while the answer is processed
    setMicNotice("");
    evaluationShownRef.current = false;
    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const result = await evaluateAnswer(currentQuestion.id, answer);
      if (!mountedRef.current) return; // user already left Tier 1
      evaluationShownRef.current = true;
      setEvaluation(result);
      playTamilResult(result.feedback_tamil);
      starsRef.current += result.stars;
      setSessionStars(starsRef.current);
      if (result.correct) {
        correctRef.current += 1;
        setSessionCorrect(correctRef.current);
      }
    } catch {
      if (!mountedRef.current) return;
      evaluationShownRef.current = true;
      setEvaluation({
        correct: false,
        stars: 0,
        feedback: "Something went wrong. Let's try again! 🌸",
        feedback_tamil: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சி செய்வோம்.",
        suggestion: null,
        model_answer: "",
        encouragement: "Keep going!",
        transcribed_text: answer,
        transcribed_tamil: "",
        semantic_score: 0,
        sentiment: "Neutral",
      });
    } finally {
      evaluatingRef.current = false;
      setIsEvaluating(false);
    }
  }, [currentQuestion, playTamilResult, abortListening]);

  // Keep the latest submitAnswer reachable from long-lived recognition callbacks
  useEffect(() => {
    submitRef.current = submitAnswer;
  }, [submitAnswer]);

// Speaker button / initial playback: scenario (Tamil) then the character's Tamil line.
// playSequence() stops whatever is playing first, so repeated clicks never overlap.
const handlePlayAudio = useCallback(async () => {
  if (!currentQuestion) return;
  const items = [];
  const storyTa = currentQuestion.social_story_tamil;
  if (storyTa) items.push({ url: getTtsAudioUrl(storyTa, "Scenario"), text: storyTa });
  items.push({ url: getAudioUrl(currentQuestion.id), text: currentQuestion.question_tamil || "" });
  abortListening(); // never record while the computer is speaking
  setIsPlaying(true);
  const result = await playSequence(items);
  if (result !== "cancelled") setIsPlaying(false);
  listenAfterSpeech(result); // only when playback really finished ("done")
}, [currentQuestion, abortListening, listenAfterSpeech]);

// Play once when a question opens; silence everything when it changes or the page unmounts.
useEffect(() => {
  let alive = true;
  if (currentQuestion && alive) {
    handlePlayAudio();
  }
  return () => {
    alive = false;
    abortListening();
    stopAll();
  };
}, [currentQuestion, handlePlayAudio, abortListening]);

  // Manual microphone control stays available as a fallback (tap again while listening = stop)
  const handleMicTap = useCallback(() => {
    if (recognitionRef.current) {
      abortListening();
      return;
    }
    startListening(false);
  }, [abortListening, startListening]);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setSttText(textInput.trim());
      submitAnswer(textInput.trim());
      setTextInput("");
    }
  };

  const handleNext = () => {
    abortListening();
    evaluationShownRef.current = false;
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setEvaluation(null);
      setSttText("");
      setShowTextInput(false);
    } else {
      // Session complete — use refs to avoid stale state from async setState
      router.push(`/session/complete?stars=${starsRef.current}&correct=${correctRef.current}&total=${questions.length}&character=${characterName}&lessonId=${lessonId || ''}&tier=${tier || 1}`);
    }
  };

  const handleRetry = () => {
    evaluationShownRef.current = false;
    setEvaluation(null);
    setSttText("");
    startListening(false); // the child just tapped "Try Again": open the mic straight away
  };

  if (loading) {
    return (
      <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[20px] font-semibold text-on-surface-variant">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !charMeta) {
    return (
      <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <span className="material-symbols-outlined text-[64px] text-on-surface-variant">error_outline</span>
          <p className="text-[20px] font-semibold text-on-surface-variant">Could not load questions. Make sure the backend is running.</p>
          <button onClick={() => router.push("/choose-friend")} className="mt-4 px-8 py-3 bg-primary text-on-primary rounded-full text-[18px] font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background h-screen h-[100dvh] flex flex-col font-sans overflow-hidden antialiased">
      {/* Top Navigation */}
      <header className="w-full h-14 flex justify-between items-center px-4 md:px-12 shrink-0 relative z-10">
        <button 
          onClick={() => {
            abortListening(); // release the microphone immediately
            stopAll(); // silence audio immediately, before the route change completes
            router.push("/choose-friend");
          }}
          className="w-11 h-11 flex items-center justify-center text-primary rounded-full hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm bg-surface"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        
        {/* Progress Bar */}
        <div className="flex-1 mx-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-surface-container-high rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[13px] font-bold text-on-surface-variant whitespace-nowrap">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[16px] font-bold text-primary">{sessionStars}</span>
        </div>
      </header>

      {/* Main Content — fills remaining height, no scroll */}
      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 md:px-8 relative z-0 min-h-0">
        
        {/* Scene Background */}
        <div className="absolute inset-0 opacity-25 z-0 rounded-[32px] overflow-hidden mx-4">
          <img src={charMeta.backgroundPath} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Character & Dialogue Zone — compact, no grow */}
        <section className="shrink-0 flex flex-col items-center text-center relative z-10 pt-3 pb-2">
          {/* Character Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-high border-4 border-surface shadow-ambient mb-2">
            <img 
              className="w-full h-full object-cover" 
              alt={charMeta.displayName}
              src={charMeta.imagePath}
            />
          </div>
          
          {/* Social story */}
          {currentQuestion.social_story && (
            <div className="w-full max-w-lg mx-auto bg-surface-container-lowest/90 dark:bg-surface-container-low border border-outline-variant/40 border-l-4 border-l-secondary rounded-xl px-4 py-2.5 mb-2 shadow-sm text-left backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-0.5">📖 Scenario</p>
              <p className="text-[14px] leading-[20px] text-on-surface font-medium line-clamp-2">
                {currentQuestion.social_story}
              </p>
            </div>
          )}

          {/* Dialogue Bubble */}
          <div className="flex items-center gap-3 bg-surface-container-lowest/95 dark:bg-surface-container border border-outline-variant/60 px-4 py-3 rounded-2xl shadow-sm max-w-lg w-full backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-[13px] font-bold text-primary mb-0.5">{charMeta.displayName} says:</p>
              <h2 className="text-[18px] font-semibold leading-[26px] text-on-surface tracking-[0.02em]">
                {currentQuestion.question_tanglish}
              </h2>
              <p className="text-[13px] leading-[20px] text-on-surface-variant mt-0.5 font-medium">
                {currentQuestion.question_tamil}
              </p>
            </div>
            <button 
              onClick={handlePlayAudio}
              className={`w-[44px] h-[44px] flex-shrink-0 flex items-center justify-center bg-primary text-on-primary rounded-full hover:bg-surface-tint active:scale-95 transition-all shadow-sm ${isPlaying ? 'scale-110' : ''}`}
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                volume_up
              </span>
            </button>
          </div>

          {/* Lesson & Difficulty badge */}
          <div className="flex gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[12px] font-bold">
              📚 {currentQuestion.lesson}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container text-[12px] font-bold">
              Level {currentQuestion.difficulty}
            </span>
          </div>
        </section>

        {/* Scrollable interaction zone: evaluation result OR mic input */}
        <div className="flex-1 flex flex-col relative z-10 overflow-y-auto min-h-0">
        {/* Evaluation Result */}
        {evaluation && (
          <section className="flex flex-col items-center justify-center flex-1 px-2 py-2">
            <div className={`rounded-3xl p-4 shadow-ambient w-full max-w-lg border ${evaluation.correct ? 'bg-secondary-container/95 border-secondary/30' : 'bg-surface-container-lowest dark:bg-surface-container-high border-outline-variant/60'}`}>
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`material-symbols-outlined text-[28px] transition-all duration-300 ${i <= evaluation.stars ? 'text-primary' : 'text-outline-variant'}`}
                    style={{ fontVariationSettings: `'FILL' ${i <= evaluation.stars ? 1 : 0}`, transitionDelay: `${i * 80}ms` }}
                  >
                    star
                  </span>
                ))}
              </div>

              {/* Feedback */}
              <p className="text-[17px] font-bold text-center text-on-surface mb-1">
                {evaluation.feedback}
              </p>

              {evaluation.transcribed_text && (
                <p className="text-[13px] text-center text-on-surface-variant mb-1">
                  You said: <span className="font-bold text-on-surface">&ldquo;{evaluation.transcribed_text}&rdquo;</span>
                  {evaluation.transcribed_tamil && (
                    <span className="block text-[12px] font-medium text-on-surface-variant/80 mt-0.5">
                      ({evaluation.transcribed_tamil})
                    </span>
                  )}
                </p>
              )}

              {evaluation.suggestion && (
                <div className="bg-surface-container-lowest/60 rounded-xl px-3 py-2 mt-1">
                  <p className="text-[13px] text-on-surface-variant text-center">
                    💡 {evaluation.suggestion}
                  </p>
                </div>
              )}

              <p className="text-[12px] text-center text-on-surface-variant mt-2 font-medium">
                {evaluation.encouragement}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-3 justify-center">
                {!evaluation.correct && (
                  <button
                    onClick={handleRetry}
                    className="px-5 py-2.5 border-2 border-primary text-primary rounded-full text-[15px] font-semibold hover:bg-primary-container/30 transition-colors active:scale-95"
                  >
                    🔄 Try Again
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-7 py-2.5 bg-primary text-on-primary rounded-full text-[15px] font-semibold hover:bg-surface-tint transition-colors active:scale-95 shadow-sm"
                >
                  {currentIndex < questions.length - 1 ? "Next" : "Finish"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Microphone Input Zone */}
        {!evaluation && (
          <section className="flex-1 flex flex-col justify-center items-center relative z-10">
            {isEvaluating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[16px] font-semibold text-on-surface-variant">Evaluating your answer...</p>
              </div>
            ) : (
              <>
                {/* Pulse rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {isListening && (
                    <>
                      <div className="absolute w-56 h-56 bg-primary-container rounded-full pulse-ring" />
                      <div className="absolute w-72 h-72 bg-primary-container rounded-full pulse-ring" style={{ animationDelay: '1.5s' }} />
                    </>
                  )}
                </div>
                
                {/* Mic Button */}
                <button 
                  onClick={handleMicTap}
                  className={`relative z-10 w-40 h-40 [@media(max-height:700px)]:w-28 [@media(max-height:700px)]:h-28 rounded-full flex items-center justify-center shadow-ambient hover:shadow-lg active:scale-95 transition-all duration-300 ${
                    isListening ? 'bg-primary-container text-primary' : 'bg-primary text-on-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[72px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mic
                  </span>
                </button>
                <p className="mt-6 text-[16px] font-semibold tracking-[0.04em] text-on-surface-variant z-10 bg-surface/80 px-4 py-2 rounded-full backdrop-blur-sm">
                  {isListening ? "Listening..." : micNotice || "Tap to speak"}
                </p>
                
                {/* Text Input Toggle */}
                {!isListening && !showTextInput && (
                  <button 
                    onClick={() => setShowTextInput(true)}
                    className="mt-3 px-6 py-3 border-2 border-secondary text-secondary rounded-full text-[16px] font-semibold hover:bg-secondary-container/50 transition-colors z-10"
                  >
                    ⌨️ I prefer to type
                  </button>
                )}

                {/* Text Input Area */}
                {showTextInput && (
                  <div className="mt-4 flex gap-2 z-10 w-full max-w-md px-4">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                      placeholder="Type your answer..."
                      className="flex-1 px-5 py-3 bg-surface-container border-2 border-outline-variant rounded-2xl text-[18px] text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={handleTextSubmit}
                      className="px-6 py-3 bg-primary text-on-primary rounded-2xl text-[16px] font-bold hover:bg-surface-tint active:scale-95 transition-all"
                    >
                      Send
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
        </div>{/* end scrollable zone */}
      </main>
    </div>
  );
}

function Tier2SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterName = searchParams.get("character") || "Father";
  const lessonId = searchParams.get("lessonId");

  const [charMeta, setCharMeta] = useState<CharacterMeta | null>(null);
  const [lesson, setLesson] = useState<Tier2Lesson | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    { speaker: "character" | "child"; text: string; tamilText?: string; englishText?: string }[]
  >([]);
  const [retryCount, setRetryCount] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const [sttText, setSttText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Tier2EvaluationResult | null>(null);
  const [sessionStars, setSessionStars] = useState(0);
  const [expandedTranslations, setExpandedTranslations] = useState<number[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recognitionRef = useRef<any>(null);
  const starsAccumulatedRef = useRef<number>(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, evaluation, isEvaluating]);

  const mountedRef = useRef(true);
  const initialBlockedRef = useRef(false);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Turn-taking state (refs so async callbacks always see the latest value)
  const evaluatingRef = useRef(false);
  const completedRef = useRef(false);
  const finalAppreciationDoneRef = useRef(false); // closing appreciation fires at most once
  const listenGenRef = useRef(0);
  const silentRoundsRef = useRef(0);
  const micBlockedRef = useRef(false);
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitRef = useRef<(answer: string) => void>(() => {});
  const [micNotice, setMicNotice] = useState("");

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      if (mountedRef.current) fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  // Turn the microphone OFF and invalidate any pending/auto listen. Safe to call any time.
  const abortListening = useCallback(() => {
    listenGenRef.current++;
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onstart = rec.onresult = rec.onerror = rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    }
    setIsListening(false);
  }, []);

  // Mount flag + full cleanup: leaving the lesson silences audio AND the microphone and cancels callbacks.
  useEffect(() => {
    mountedRef.current = true;
    const timers = timersRef.current;
    const onPageHide = () => abortListening();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("pagehide", onPageHide);
      timers.forEach(clearTimeout);
      timers.clear();
      abortListening();
      stopAll();
    };
  }, [abortListening]);

  // Silence in the answer window: retry listening once, then stop and hand control to the child.
  const handleSilence = useCallback(
    (retry: () => void) => {
      silentRoundsRef.current += 1;
      if (silentRoundsRef.current < 2) {
        autoListenTimerRef.current = later(retry, 500);
      } else {
        silentRoundsRef.current = 0;
        setMicNotice("Tap the microphone when you are ready to answer");
      }
    },
    [later]
  );

  // Start the microphone. auto=true when triggered by the end of the computer's speech.
  const startListening = useCallback(
    (auto: boolean) => {
      if (!mountedRef.current || completedRef.current || evaluatingRef.current) return;
      if (recognitionRef.current) return; // never two microphone sessions
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setShowTextInput(true);
        return;
      }
      if (auto && micBlockedRef.current) return;
      if (!auto) {
        silentRoundsRef.current = 0;
        micBlockedRef.current = false;
      }
      stopAll(); // the mic must never run while any voice is playing
      setMicNotice("");

      const gen = ++listenGenRef.current;
      const rec = new SpeechRecognitionAPI();
      rec.lang = "ta-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      let handled = false;
      const stale = () => gen !== listenGenRef.current || !mountedRef.current;

      rec.onstart = () => {
        if (stale()) return;
        setIsListening(true);
        setSttText("");
      };
      rec.onresult = (e: any) => {
        if (stale() || handled) return;
        handled = true;
        const transcript = e.results?.[0]?.[0]?.transcript?.trim();
        recognitionRef.current = null;
        setIsListening(false);
        if (!transcript) {
          handleSilence(() => startListeningRef.current(true));
          return;
        }
        silentRoundsRef.current = 0;
        setSttText(transcript);
        submitRef.current(transcript); // mic is already off while the answer is processed
      };
      rec.onerror = (e: any) => {
        if (stale() || handled) return;
        handled = true;
        recognitionRef.current = null;
        setIsListening(false);
        const err = e?.error;
        if (err === "no-speech") {
          handleSilence(() => startListeningRef.current(true));
        } else if (err === "not-allowed" || err === "service-not-allowed") {
          micBlockedRef.current = true;
          setShowTextInput(true);
          setMicNotice("Microphone is blocked. You can type your answer instead.");
        } else if (err === "audio-capture" || err === "network") {
          micBlockedRef.current = true;
          setShowTextInput(true);
          setMicNotice("Microphone is not available. You can type your answer instead.");
        }
        // "aborted": we stopped it ourselves, nothing to do
      };
      rec.onend = () => {
        if (stale() || handled) return;
        handled = true;
        recognitionRef.current = null;
        setIsListening(false);
        handleSilence(() => startListeningRef.current(true)); // ended with no result = silence
      };
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch {
        recognitionRef.current = null;
        setIsListening(false);
      }
    },
    [handleSilence]
  );

  // Lets the recognition callbacks call the latest startListening (retry after silence)
  const startListeningRef = useRef<(auto: boolean) => void>(() => {});
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // After the computer has COMPLETELY finished speaking, open the microphone (once).
  const listenAfterSpeech = useCallback(
    (result: "done" | "cancelled" | "blocked") => {
      if (result !== "done" || !mountedRef.current || completedRef.current || evaluatingRef.current) return;
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
      // short pause so the tail of the voice is not picked up by the microphone
      autoListenTimerRef.current = later(() => {
        autoListenTimerRef.current = null;
        startListening(true);
      }, 400);
    },
    [later, startListening]
  );

  // All Tier 2 playback goes through the central manager: one audio at a time, previous one stopped first.
  // The microphone is switched off before any computer speech starts.
  const playAudioSequence = useCallback(
    async (items: { text: string; character: string }[]) => {
      const playable = items.filter((it) => it.text?.trim() && /[\u0B80-\u0BFF]/.test(it.text));
      if (playable.length === 0) return "done" as const;
      abortListening();
      setIsPlayingAudio(true);
      const result = await playSequence(
        playable.map((it) => ({ url: getTtsAudioUrl(it.text, it.character), text: it.text }))
      );
      if (result !== "cancelled" && mountedRef.current) setIsPlayingAudio(false);
      return result;
    },
    [abortListening]
  );

  // Load Tier 2 Lesson (plays the opening scenario once, then opens the mic)
  useEffect(() => {
    let alive = true;
    const meta = getCharacterByBackendName(characterName);
    setCharMeta(meta || null);

    fetchTier2Lessons(characterName)
      .then((summaries) => {
        if (!alive) return;
        const targetSummary = lessonId ? summaries.find((s) => s.id === lessonId) : summaries[0];
        if (targetSummary) {
          fetchTier2Lesson(targetSummary.id).then((fullLesson) => {
            if (!alive) return; // unmounted / Strict Mode re-run: never start audio
            setLesson(fullLesson);
            if (fullLesson.turns.length > 0) {
              const firstTurn = fullLesson.turns[0];
              setCurrentTurnId(firstTurn.turn_id);
              setConversationHistory([
                {
                  speaker: "character",
                  text: firstTurn.prompt.tanglish,
                  tamilText: firstTurn.prompt.tamil,
                  englishText: (firstTurn.prompt as any).english || fullLesson.initial_prompt?.english,
                },
              ]);

              const promptText = firstTurn.prompt.tamil || firstTurn.prompt.tanglish;
              playAudioSequence([
                ...(fullLesson.scenario_tamil
                  ? [{ text: fullLesson.scenario_tamil, character: "Scenario" }]
                  : []),
                { text: promptText, character: "Scenario" },
              ]).then((r) => {
                // Browser blocked autoplay: allow ONE retry on the first user gesture
                if (r === "blocked") initialBlockedRef.current = true;
                listenAfterSpeech(r);
              });
            }
          });
        }
      })
      .catch(console.error);

    return () => {
      alive = false;
      stopAll();
    };
  }, [characterName, lessonId, playAudioSequence, listenAfterSpeech]);

  // Only if autoplay was blocked: first user gesture plays the opening scenario once.
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (initialBlockedRef.current && lesson && lesson.turns.length > 0) {
        initialBlockedRef.current = false;
        const firstTurn = lesson.turns[0];
        const promptText = firstTurn.prompt.tamil || firstTurn.prompt.tanglish;
        playAudioSequence([
          ...(lesson.scenario_tamil ? [{ text: lesson.scenario_tamil, character: "Scenario" }] : []),
          { text: promptText, character: "Scenario" },
        ]).then(listenAfterSpeech);
      }
    };
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [lesson, playAudioSequence, listenAfterSpeech]);

  const goToComplete = useCallback(
    (lessonData: Tier2Lesson) => {
      const finalStars = starsAccumulatedRef.current;
      router.push(
        `/session/complete?stars=${finalStars}&correct=${lessonData.turns.length}&total=${lessonData.turns.length}&character=${characterName}&tier=2&lessonId=${lessonData.id}`
      );
    },
    [router, characterName]
  );

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!lesson || !currentTurnId || !answer.trim()) return;
      if (evaluatingRef.current || completedRef.current) return; // one answer at a time
      evaluatingRef.current = true;
      abortListening(); // microphone OFF while the answer is processed
      setMicNotice("");
      setIsEvaluating(true);
      setEvaluation(null);

      try {
        const result = await evaluateTier2Turn(lesson.id, currentTurnId, answer, retryCount);
        if (!mountedRef.current) return; // user already left the lesson
        setEvaluation(result);

        // NO appreciation after individual answers. Only hints / gentle redirects are spoken
        // (feedback_tamil is empty for a normal correct answer).
        const audio: { text: string; character: string }[] = [];
        if (result.feedback_tamil) {
          audio.push({ text: result.feedback_tamil, character: "Result" });
        }

        if (result.correct) {
          const awarded = result.stars_awarded || 1;
          starsAccumulatedRef.current += awarded;
          setSessionStars(starsAccumulatedRef.current);

          setConversationHistory((prev) => [
            ...prev,
            { speaker: "child", text: result.transcribed_text, tamilText: result.transcribed_tamil },
          ]);

          // The computer's next line (or the closing line of the conversation)
          if (result.next_character_reply) {
            audio.push({
              text: result.next_character_reply.tamil || result.next_character_reply.tanglish,
              character: "Scenario",
            });
          }

          // ONE final appreciation, only when the whole conversation is complete, only once
          const finalText =
            result.is_completed && !finalAppreciationDoneRef.current
              ? result.final_appreciation_tamil || ""
              : "";
          if (result.is_completed) {
            completedRef.current = true;
            finalAppreciationDoneRef.current = true;
            if (finalText) audio.push({ text: finalText, character: "Result" });
          }

          const audioDone = audio.length > 0 ? playAudioSequence(audio) : Promise.resolve("done" as const);

          if (result.next_character_reply) {
            later(() => {
              setConversationHistory((prev) => [
                ...prev,
                {
                  speaker: "character",
                  text: result.next_character_reply!.tanglish,
                  tamilText: result.next_character_reply!.tamil,
                  englishText: (result.next_character_reply as any).english,
                },
                ...(finalText ? [{ speaker: "character" as const, text: finalText }] : []),
              ]);
              setCurrentTurnId(result.next_turn_id);
              setEvaluation(null);
              setRetryCount(0);
            }, 1200);
          } else if (finalText) {
            setConversationHistory((prev) => [...prev, { speaker: "character", text: finalText }]);
          }

          if (result.is_completed) {
            // Leave only after everything has been spoken (capped), and only if still on this lesson
            audioDone.then(async () => {
              await new Promise((r) => setTimeout(r, 800));
              if (!mountedRef.current) return;
              goToComplete(lesson);
            });
            setTimeout(() => {
              if (mountedRef.current) goToComplete(lesson);
            }, 20000);
          } else {
            audioDone.then(listenAfterSpeech); // next question finished speaking -> mic ON
          }
        } else {
          setRetryCount((prev) => prev + 1);
          // Hint / gentle correction is spoken in Tamil, then the mic opens for another try
          if (audio.length > 0) {
            playAudioSequence(audio).then(listenAfterSpeech);
          } else {
            listenAfterSpeech("done");
          }
        }
      } catch (err) {
        console.error("Tier 2 evaluation error:", err);
      } finally {
        evaluatingRef.current = false;
        setIsEvaluating(false);
      }
    },
    [lesson, currentTurnId, retryCount, playAudioSequence, later, abortListening, listenAfterSpeech, goToComplete]
  );

  // Keep the latest submitAnswer reachable from long-lived recognition callbacks
  useEffect(() => {
    submitRef.current = submitAnswer;
  }, [submitAnswer]);

  // Manual microphone control (always available as a fallback)
  const handleMicTap = useCallback(() => {
    if (recognitionRef.current) {
      abortListening(); // tap again while listening = stop
      return;
    }
    startListening(false);
  }, [abortListening, startListening]);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setSttText(textInput.trim());
      submitAnswer(textInput.trim());
      setTextInput("");
    }
  };

  if (!charMeta || !lesson) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Turn progress calculation
  const currentTurnIndex = lesson.turns.findIndex((t) => t.turn_id === currentTurnId);
  const displayTurnNum = currentTurnIndex >= 0 ? currentTurnIndex + 1 : lesson.turns.length;

  return (
    <div className="bg-background text-on-background h-screen h-[100dvh] max-h-[100dvh] flex flex-col font-sans overflow-hidden antialiased relative selection:bg-primary-container">
      {/* Background Environment Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-25"
        style={{ backgroundImage: `url(${charMeta.backgroundPath})` }}
      />

      {/* Compact Top Header Bar */}
      <header className="w-full h-14 shrink-0 flex justify-between items-center px-4 md:px-8 border-b border-surface-variant/40 bg-surface/90 backdrop-blur-md relative z-20">
        <button
          onClick={() => {
            abortListening();
            stopAll();
            router.push(`/roadmap/${charMeta.backendName}`);
          }}
          className="w-10 h-10 flex items-center justify-center text-primary rounded-full hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm bg-surface-container"
          aria-label="Back to roadmap"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary shadow-sm">
            <img src={charMeta.imagePath} alt={charMeta.displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-on-surface leading-tight">{charMeta.displayName}</h2>
            <p className="text-[11px] font-semibold text-secondary">
              Turn {displayTurnNum} of {lesson.turns.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full shadow-sm">
          <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="text-[14px] font-extrabold text-primary">{sessionStars}</span>
        </div>
      </header>

      {/* Main Conversation Canvas (Fits exact remaining height) */}
      <main className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 py-2 relative z-10 overflow-hidden min-h-0">
        {/* Scenario Context Card (Compact & Readable) */}
        {lesson.scenario && (
          <div className="shrink-0 w-full bg-surface-container-low/95 border-l-4 border-secondary rounded-2xl px-4 py-2.5 mb-2 shadow-sm flex items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="text-[18px] select-none shrink-0 mt-0.5">📖</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-secondary block leading-none mb-1">
                  Scenario Context
                </span>
                <p className="text-[14px] leading-snug text-on-surface font-medium">
                  {lesson.scenario}
                </p>
              </div>
            </div>
            <button
              onClick={() => playAudioSequence([{ text: lesson.scenario_tamil || "", character: "Scenario" }]).then(listenAfterSpeech)}
              className="shrink-0 p-2 text-secondary hover:bg-secondary/10 active:scale-95 rounded-full transition-all flex items-center justify-center cursor-pointer"
              title="Read scenario aloud"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">volume_up</span>
            </button>
          </div>
        )}

        {/* Scrollable Conversation Stream */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto pr-1 space-y-3 py-2 scroll-smooth min-h-0"
        >
          {conversationHistory.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.speaker === "character" ? "items-start" : "items-end"}`}>
              <div className={`flex ${msg.speaker === "character" ? "justify-start" : "justify-end"} items-end gap-2.5 w-full`}>
                {msg.speaker === "character" && (
                  <div className="w-10 h-10 shrink-0 rounded-full border-2 border-primary/50 overflow-hidden shadow-sm">
                    <img src={charMeta.imagePath} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[82%] shadow-sm ${
                    msg.speaker === "character"
                      ? "bg-surface-container text-on-surface rounded-bl-sm border border-outline-variant/40"
                      : "bg-primary text-on-primary rounded-br-sm font-medium"
                  }`}
                >
                  <p className="text-[16px] leading-[22px] font-semibold tracking-[0.01em]">{msg.text}</p>
                  {msg.tamilText && (
                    <p
                      className={`text-[13px] leading-[18px] mt-1 font-medium ${
                        msg.speaker === "character" ? "text-on-surface-variant" : "text-on-primary/85"
                      }`}
                    >
                      {msg.tamilText}
                    </p>
                  )}
                </div>

                {msg.speaker === "character" && (
                  <button
                    onClick={() => {
                                      playAudioSequence([
                        {
                          text: msg.tamilText || msg.text,
                          character: "Scenario",
                        },
                      ]).then(listenAfterSpeech);
                    }}
                    className="p-2 rounded-full text-primary hover:bg-primary/15 active:scale-95 transition-all self-center shrink-0 cursor-pointer flex items-center justify-center border border-primary/30 bg-surface-container shadow-xs"
                    title="Listen to character voice"
                    aria-label="Replay audio"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">volume_up</span>
                  </button>
                )}
              </div>

              {/* Subtitle Translation Dropdown for Character Messages */}
              {msg.englishText && (
                <div className={`mt-1 ${msg.speaker === "character" ? "ml-12" : "mr-2"}`}>
                  <button
                    onClick={() =>
                      setExpandedTranslations((prev) =>
                        prev.includes(i) ? prev.filter((idx) => idx !== i) : [...prev, i]
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-0.5 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant rounded-full text-[11px] font-bold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">translate</span>
                    <span>{expandedTranslations.includes(i) ? "Hide English" : "English Subtitle"}</span>
                  </button>
                  {expandedTranslations.includes(i) && (
                    <div className="mt-1 bg-surface-container-lowest border border-outline-variant/80 p-2.5 rounded-xl max-w-sm shadow-sm">
                      <p className="text-[13px] text-on-surface font-medium leading-snug">{msg.englishText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Gentle Hint / Correction Card */}
          {evaluation && !evaluation.correct && (
            <div className="bg-error-container/90 text-on-error-container p-3 rounded-2xl mt-2 max-w-md mx-auto text-center shadow-sm border border-error/30">
              <p className="font-bold text-[13px]">{evaluation.feedback}</p>
              {evaluation.suggestion && (
                <p className="text-[12px] font-medium opacity-90 mt-0.5">💡 {evaluation.suggestion}</p>
              )}
              <button
                onClick={() => setEvaluation(null)}
                className="mt-2 px-4 py-1 bg-error text-on-error rounded-full font-bold text-[12px] shadow-sm active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Docked Bottom Interaction Bar (Zero Viewport Overflow) */}
      <footer className="w-full shrink-0 p-3 bg-surface/95 backdrop-blur-md border-t border-surface-variant/40 flex flex-col items-center relative z-20">
        {isEvaluating ? (
          <div className="flex items-center gap-3 py-2">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[14px] font-bold text-primary">Listening & Evaluating...</p>
          </div>
        ) : showTextInput ? (
          <div className="flex items-center gap-2 w-full max-w-md">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
              className="flex-1 px-4 py-2 rounded-full border-2 border-outline-variant focus:border-primary bg-surface-container text-on-surface text-[14px] outline-none"
              placeholder="Type your response..."
              autoFocus
            />
            <button
              onClick={handleTextSubmit}
              className="px-5 py-2 bg-primary text-on-primary rounded-full font-bold text-[14px] hover:bg-surface-tint active:scale-95 transition-all shadow-sm"
            >
              Send
            </button>
            <button
              onClick={() => setShowTextInput(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              title="Use microphone"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleMicTap}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                  isListening
                    ? "bg-primary text-on-primary ring-4 ring-primary-container scale-105 animate-pulse"
                    : "bg-primary text-on-primary hover:bg-surface-tint"
                }`}
                aria-label="Tap to speak"
              >
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isListening ? "mic" : "mic_none"}
                </span>
              </button>

              <button
                onClick={() => setShowTextInput(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors shadow-sm"
                title="Type answer instead"
                aria-label="Type response"
              >
                <span className="material-symbols-outlined text-[20px]">keyboard</span>
              </button>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">
              {isListening ? "Listening... Speak your answer" : micNotice || "Tap microphone to speak"}
            </p>
          </div>
        )}
      </footer>
    </div>
  );
}

function SessionContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier");
  
  if (tier === "2") {
    return <Tier2SessionContent />;
  }
  return <Tier1SessionContent />;
}

export default function YourSession() {
  return (
    <Suspense fallback={
      <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-sans">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
