import re

with open('src/app/session/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Rename SessionContent to Tier1SessionContent
content = content.replace('function SessionContent() {', 'function Tier1SessionContent() {')

# 2. Add imports
imports = """
import { fetchTier2Lessons, fetchTier2Lesson, evaluateTier2Turn } from "@/lib/api";
import type { Tier2LessonSummary, Tier2Lesson, Tier2EvaluationResult } from "@/lib/api";
"""
content = content.replace('import type { CharacterMeta } from "@/lib/characters";', 'import type { CharacterMeta } from "@/lib/characters";' + imports)

# 3. Add Tier2SessionContent
tier2_code = """
function Tier2SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterName = searchParams.get("character") || "Father";

  const [charMeta, setCharMeta] = useState<CharacterMeta | null>(null);
  const [lesson, setLesson] = useState<Tier2Lesson | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{ speaker: 'character' | 'child', text: string, tamilText?: string }[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  
  const [isListening, setIsListening] = useState(false);
  const [sttText, setSttText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Tier2EvaluationResult | null>(null);
  const [sessionStars, setSessionStars] = useState(0);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const meta = getCharacterByBackendName(characterName);
    setCharMeta(meta || null);

    fetchTier2Lessons(characterName)
      .then((summaries) => {
        if (summaries.length > 0) {
          fetchTier2Lesson(summaries[0].id).then(fullLesson => {
            setLesson(fullLesson);
            if (fullLesson.turns.length > 0) {
              setCurrentTurnId(fullLesson.turns[0].turn_id);
              setConversationHistory([
                { speaker: 'character', text: fullLesson.turns[0].prompt.tanglish, tamilText: fullLesson.turns[0].prompt.tamil }
              ]);
              playTTS(fullLesson.turns[0].prompt.tanglish);
            }
          });
        }
      });
  }, [characterName]);

  const playTTS = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      if (characterName === "Father" || characterName === "Stranger" || characterName === "Friend") {
        const maleVoice = voices.find(v => v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("male") || (!v.name.toLowerCase().includes("female") && !v.name.toLowerCase().includes("zira")));
        if (maleVoice) utterance.voice = maleVoice;
        utterance.pitch = 0.75;
      } else if (characterName === "Teacher") {
        const femaleVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira"));
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.pitch = 1.1;
      }
      speechSynthesis.speak(utterance);
    }
  };

  const submitAnswer = useCallback(async (answer: string) => {
    if (!lesson || !currentTurnId || !answer.trim()) return;
    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const result = await evaluateTier2Turn(lesson.id, currentTurnId, answer, retryCount);
      setEvaluation(result);
      
      if (result.correct) {
        setSessionStars(prev => prev + result.stars_awarded);
        setConversationHistory(prev => [
          ...prev,
          { speaker: 'child', text: answer }
        ]);
        
        if (result.next_character_reply) {
           setTimeout(() => {
             setConversationHistory(prev => [
               ...prev,
               { speaker: 'character', text: result.next_character_reply!.tanglish, tamilText: result.next_character_reply!.tamil }
             ]);
             playTTS(result.next_character_reply!.tanglish);
             setCurrentTurnId(result.next_turn_id);
             setEvaluation(null);
           }, 2000);
        } else {
           setTimeout(() => {
             router.push(`/session/complete?stars=${sessionStars + result.stars_awarded}&character=${characterName}&tier=2`);
           }, 3000);
        }
      } else {
        setRetryCount(prev => prev + 1);
      }
    } catch {
      // error
    } finally {
      setIsEvaluating(false);
    }
  }, [lesson, currentTurnId, retryCount, characterName, sessionStars, router]);

  // STT Handlers
  const handleMicTap = useCallback(() => {
    if (isListening) return;
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setShowTextInput(true);
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "ta-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setIsListening(true); setSttText(""); };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setSttText(transcript);
      setIsListening(false);
      submitAnswer(transcript);
    };
    recognition.onerror = (e: any) => {
      if (e.error !== 'not-allowed') { setIsListening(false); setShowTextInput(true); }
    };
    recognition.onend = () => { setIsListening(false); };
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

  if (!charMeta || !lesson) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans overflow-hidden antialiased">
      <header className="w-full h-16 flex justify-between items-center px-4 md:px-12 shrink-0 relative z-10 mt-2">
        <button onClick={() => router.push("/choose-friend")} className="w-14 h-14 flex items-center justify-center text-primary rounded-full hover:bg-surface-container-high transition-colors active:scale-95 shadow-sm bg-surface"><span className="material-symbols-outlined">close</span></button>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-sm font-bold">Tier 2: Conversation</span>
          <span className="material-symbols-outlined text-[24px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[18px] font-bold text-primary">{sessionStars}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 relative z-0 pb-32">
        <div className="absolute inset-0 opacity-15 z-0 rounded-[32px] overflow-hidden mx-4 mt-2"><img src={charMeta.backgroundPath} alt="" className="w-full h-full object-cover" /></div>
        
        <div className="relative z-10 flex-1 flex flex-col gap-6 p-4 overflow-y-auto">
           {conversationHistory.map((msg, i) => (
             <div key={i} className={`flex ${msg.speaker === 'character' ? 'justify-start' : 'justify-end'} items-end gap-3`}>
               {msg.speaker === 'character' && (
                 <img src={charMeta.imagePath} className="w-12 h-12 rounded-full border-2 border-primary object-cover" />
               )}
               <div className={`p-4 rounded-2xl max-w-[75%] ${msg.speaker === 'character' ? 'bg-surface-container text-on-surface rounded-bl-sm' : 'bg-primary text-on-primary rounded-br-sm shadow-md'}`}>
                 <p className="text-[18px] font-semibold">{msg.text}</p>
                 {msg.tamilText && <p className="text-[14px] mt-1 opacity-80">{msg.tamilText}</p>}
               </div>
             </div>
           ))}

           {evaluation && !evaluation.correct && (
             <div className="bg-error-container text-on-error-container p-4 rounded-xl mt-4 max-w-lg mx-auto text-center shadow-sm">
                <p className="font-bold mb-1">{evaluation.feedback}</p>
                {evaluation.suggestion && <p className="text-sm opacity-90">💡 {evaluation.suggestion}</p>}
                <button onClick={() => setEvaluation(null)} className="mt-3 px-6 py-2 bg-error text-on-error rounded-full font-bold">Try Again</button>
             </div>
           )}
        </div>
      </main>

      {!evaluation?.correct && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-surface/90 backdrop-blur-md border-t border-surface-variant flex flex-col items-center z-50">
           {isEvaluating ? (
              <div className="flex items-center gap-3 py-4"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /><p>Evaluating...</p></div>
           ) : (
              showTextInput ? (
                <div className="flex gap-2 w-full max-w-md">
                   <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleTextSubmit()} className="flex-1 px-4 py-3 rounded-full border-2 border-outline focus:border-primary bg-surface-container" placeholder="Type answer..." />
                   <button onClick={handleTextSubmit} className="px-6 bg-primary text-on-primary rounded-full font-bold">Send</button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button onClick={handleMicTap} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-primary-container text-primary shadow-lg scale-110' : 'bg-primary text-on-primary'}`}>
                    <span className="material-symbols-outlined text-[40px]">{isListening ? 'mic' : 'mic_none'}</span>
                  </button>
                  <button onClick={() => setShowTextInput(true)} className="mt-2 text-sm text-secondary font-medium">Type instead</button>
                </div>
              )
           )}
        </div>
      )}
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
"""

content = content.replace('export default function YourSession() {', tier2_code + '\nexport default function YourSession() {')

with open('src/app/session/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
