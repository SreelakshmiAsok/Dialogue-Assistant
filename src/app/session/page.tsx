"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchQuestions, evaluateAnswer, getAudioUrl } from "@/lib/api";
import { getCharacterByBackendName } from "@/lib/characters";
import type { Question, EvaluationResult } from "@/lib/api";
import type { CharacterMeta } from "@/lib/characters";

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterName = searchParams.get("character") || "Father";

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const currentQuestion = questions[currentIndex] || null;
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  // Load character and questions
  useEffect(() => {
    const meta = getCharacterByBackendName(characterName);
    setCharMeta(meta || null);

    fetchQuestions(characterName)
      .then((qs) => {
        setQuestions(qs);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [characterName]);

  // Play question audio via TTS
  const handlePlayAudio = useCallback(() => {
    if (!currentQuestion) return;
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(getAudioUrl(currentQuestion.id));
    audioRef.current = audio;
    audio.play().catch(() => {
      // TTS fallback using browser speechSynthesis
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(currentQuestion.question_tanglish);
        utterance.rate = 0.85;
        utterance.onend = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
        return;
      }
    });
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      // Browser TTS fallback
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(currentQuestion.question_tanglish);
        utterance.rate = 0.85;
        utterance.onend = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
      }
    };
  }, [currentQuestion]);

  // Submit answer for evaluation
  const submitAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || !answer.trim()) return;
    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const result = await evaluateAnswer(currentQuestion.id, answer);
      setEvaluation(result);
      setSessionStars((prev) => prev + result.stars);
      if (result.correct) setSessionCorrect((prev) => prev + 1);
    } catch {
      setEvaluation({
        correct: false,
        stars: 0,
        feedback: "Something went wrong. Let's try again! 🌸",
        suggestion: null,
        model_answer: "",
        encouragement: "Keep going!",
        transcribed_text: answer,
        transcribed_tamil: "",
        semantic_score: 0,
        sentiment: "Neutral",
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [currentQuestion]);

  // Start speech recognition
  const handleMicTap = useCallback(() => {
    if (isListening) return;

    const SpeechRecognitionAPI = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setShowTextInput(true);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "ta-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setSttText("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setSttText(transcript);
      setIsListening(false);
      submitAnswer(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'not-allowed') {
        setIsListening(false);
        setShowTextInput(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, submitAnswer]);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setSttText(textInput.trim());
      submitAnswer(textInput.trim());
      setTextInput("");
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setEvaluation(null);
      setSttText("");
      setShowTextInput(false);
    } else {
      // Session complete
      router.push(`/session/complete?stars=${sessionStars}&correct=${sessionCorrect}&total=${questions.length}&character=${characterName}`);
    }
  };

  const handleRetry = () => {
    setEvaluation(null);
    setSttText("");
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
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans overflow-hidden antialiased">
      {/* Top Navigation */}
      <header className="w-full h-16 flex justify-between items-center px-4 md:px-12 shrink-0 relative z-10 mt-2">
        <button 
          onClick={() => router.push("/choose-friend")}
          className="w-14 h-14 flex items-center justify-center text-primary rounded-full hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm bg-surface"
        >
          <span className="material-symbols-outlined text-[28px]">close</span>
        </button>
        
        {/* Progress Bar */}
        <div className="flex-1 mx-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[14px] font-bold text-on-surface-variant whitespace-nowrap">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[18px] font-bold text-primary">{sessionStars}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 md:px-8 relative z-0">
        
        {/* Scene Background */}
        <div className="absolute inset-0 opacity-15 z-0 rounded-[32px] overflow-hidden mx-4 mt-2">
          <img src={charMeta.backgroundPath} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Character & Dialogue Zone */}
        <section className="flex-1 flex flex-col items-center justify-center text-center relative z-10 pb-4 min-h-[35vh]">
          {/* Character Avatar */}
          <div className="w-28 h-28 md:w-36 md:h-36 mb-4 rounded-full overflow-hidden bg-surface-container-high border-4 border-surface shadow-ambient">
            <img 
              className="w-full h-full object-cover" 
              alt={charMeta.displayName}
              src={charMeta.imagePath}
            />
          </div>
          
          {/* Social Story Context */}
          <div className="bg-surface-container/80 backdrop-blur-sm px-5 py-3 rounded-2xl mb-4 max-w-lg">
            <p className="text-[16px] leading-[24px] text-on-surface-variant italic">
              📖 {currentQuestion.social_story}
            </p>
          </div>

          {/* Dialogue Bubble */}
          <div className="flex items-center gap-3 bg-surface-container px-6 py-4 rounded-2xl shadow-sm max-w-lg">
            <div className="flex-1">
              <p className="text-[14px] font-bold text-primary mb-1">{charMeta.displayName} says:</p>
              <h2 className="text-[22px] font-semibold leading-[30px] text-on-surface tracking-[0.02em]">
                {currentQuestion.question_tanglish}
              </h2>
              <p className="text-[16px] leading-[24px] text-on-surface-variant mt-1 font-medium">
                {currentQuestion.question_tamil}
              </p>
            </div>
            <button 
              onClick={handlePlayAudio}
              className={`w-[48px] h-[48px] flex-shrink-0 flex items-center justify-center bg-primary text-on-primary rounded-full hover:bg-surface-tint active:scale-95 transition-all shadow-sm ${isPlaying ? 'scale-110' : ''}`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                volume_up
              </span>
            </button>
          </div>

          {/* Lesson & Difficulty badge */}
          <div className="flex gap-2 mt-3">
            <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[13px] font-bold">
              📚 {currentQuestion.lesson}
            </span>
            <span className="px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-[13px] font-bold">
              Level {currentQuestion.difficulty}
            </span>
          </div>
        </section>

        {/* Evaluation Result */}
        {evaluation && (
          <section className="relative z-10 mb-4">
            <div className={`rounded-3xl p-6 shadow-ambient mx-auto max-w-lg ${evaluation.correct ? 'bg-secondary-container' : 'bg-surface-container-high'}`}>
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`material-symbols-outlined text-[32px] transition-all duration-300 ${i <= evaluation.stars ? 'text-primary' : 'text-outline-variant'}`}
                    style={{ fontVariationSettings: `'FILL' ${i <= evaluation.stars ? 1 : 0}`, transitionDelay: `${i * 80}ms` }}
                  >
                    star
                  </span>
                ))}
              </div>

              {/* Feedback */}
              <p className="text-[20px] font-bold text-center text-on-surface mb-2">
                {evaluation.feedback}
              </p>

              {evaluation.transcribed_text && (
                <p className="text-[15px] text-center text-on-surface-variant mb-2">
                  You said: <span className="font-bold text-on-surface">&ldquo;{evaluation.transcribed_text}&rdquo;</span>
                  {evaluation.transcribed_tamil && (
                    <span className="block text-[14px] font-medium text-on-surface-variant/80 mt-1">
                      ({evaluation.transcribed_tamil})
                    </span>
                  )}
                </p>
              )}

              {evaluation.suggestion && (
                <div className="bg-surface-container-lowest/60 rounded-xl p-3 mt-2">
                  <p className="text-[15px] text-on-surface-variant text-center">
                    💡 {evaluation.suggestion}
                  </p>
                </div>
              )}

              <p className="text-[14px] text-center text-on-surface-variant mt-3 font-medium">
                {evaluation.encouragement}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 justify-center">
                {!evaluation.correct && (
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 border-2 border-primary text-primary rounded-full text-[16px] font-semibold hover:bg-primary-container/30 transition-colors active:scale-95"
                  >
                    🔄 Try Again
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-primary text-on-primary rounded-full text-[16px] font-semibold hover:bg-surface-tint transition-colors active:scale-95 shadow-sm"
                >
                  {currentIndex < questions.length - 1 ? "Next ➡️" : "Finish ✨"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Microphone Input Zone */}
        {!evaluation && (
          <section className="flex-1 flex flex-col justify-center items-center relative min-h-[30vh] z-10">
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
                  className={`relative z-10 w-40 h-40 rounded-full flex items-center justify-center shadow-ambient hover:shadow-lg active:scale-95 transition-all duration-300 ${
                    isListening ? 'bg-primary-container text-primary' : 'bg-primary text-on-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[72px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mic
                  </span>
                </button>
                <p className="mt-6 text-[16px] font-semibold tracking-[0.04em] text-on-surface-variant z-10 bg-surface/80 px-4 py-2 rounded-full backdrop-blur-sm">
                  {isListening ? "Listening..." : "Tap to speak"}
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
      </main>
    </div>
  );
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
