// app.js – SocialBuddy | 3-Screen Multimodal Voice & AAC Game Orchestrator with Python OWL Reasoning Backend

// ─────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────
const state = {
  screen: "LANDING",        // LANDING | CHARACTER_SELECT | GAMEPLAY | EVALUATING | RESULTS
  currentModuleId: null,
  currentScenario: null,

  // Speech
  recognition: null,
  isRecording: false,
  transcriptText: "",
  isMuted: false,
  voice: null,

  // Character animation
  characterEmotion: "neutral",
  characterIsTalking: false,
  mascotEmotion: "neutral",
  mascotIsTalking: false,

  // Pipeline
  pipelineResult: null,

  // Backend
  backendConnected: false,

  // Attention
  childName: "Friend",
  attentionAlertActive: false
};

// ─────────────────────────────────────────────
// ELEMENT CACHE
// ─────────────────────────────────────────────
let el = {};

function initElements() {
  // Screens
  el.screenLanding         = document.getElementById("screen-landing");
  el.screenCharSelect      = document.getElementById("screen-character-select");
  el.screenGameplay        = document.getElementById("screen-gameplay");

  // Backend status badge
  el.backendStatusBadge    = document.getElementById("backend-status-badge");

  // Landing tabs
  el.tabBtns               = document.querySelectorAll(".tab-btn");
  el.panelStart            = document.getElementById("panel-start");
  el.panelProgress         = document.getElementById("panel-progress");
  el.panelDashboard        = document.getElementById("panel-dashboard");
  el.btnStartSession       = document.getElementById("btn-start-session");

  // Progress panel
  el.progressOverview      = document.getElementById("progress-overview");
  el.sessionLog            = document.getElementById("session-log");

  // Settings (dashboard)
  el.childNameInput        = document.getElementById("child-name-input");
  el.voiceSelect           = document.getElementById("voice-select");
  el.muteToggle            = document.getElementById("mute-toggle");
  el.attentionStatus       = document.getElementById("attention-status");

  // Character select
  el.btnBackFromSelect     = document.getElementById("btn-back-from-select");

  // Gameplay
  el.btnBackFromGame       = document.getElementById("btn-back-from-game");
  el.gameplayTitle         = document.getElementById("gameplay-title");
  el.gameplaySubtitle      = document.getElementById("gameplay-subtitle");
  el.sceneLabel            = document.getElementById("scene-label");
  el.gameplayStage         = document.getElementById("gameplay-stage");
  el.characterContainer    = document.getElementById("character-container");
  el.mascotContainer       = document.getElementById("mascot-container");

  // Bilingual dialogue
  el.dialogueSpeakerName   = document.getElementById("dialogue-speaker-name");
  el.dialogueTanglish      = document.getElementById("dialogue-tanglish");
  el.dialogueTamil         = document.getElementById("dialogue-tamil");
  el.replayBtn             = document.getElementById("replay-btn");

  // AAC picture hint cards
  el.visualHintsCard       = document.getElementById("visual-hints-card");
  el.visualHintsGrid       = document.getElementById("visual-hints-grid");

  // Voice input
  el.micBtn                = document.getElementById("mic-btn");
  el.micStatus             = document.getElementById("mic-status");
  el.waveform              = document.getElementById("waveform");
  el.sttPreviewRow         = document.getElementById("stt-preview-row");
  el.sttPreviewText        = document.getElementById("stt-preview-text");
  el.submitBtn             = document.getElementById("submit-btn");

  // Optional Keyboard input
  el.textInput             = document.getElementById("text-input");
  el.textSubmitBtn         = document.getElementById("text-submit-btn");

  // Mascot guidance card
  el.mascotGuidanceCard    = document.getElementById("mascot-guidance-card");
  el.guidanceMascot        = document.getElementById("guidance-mascot");
  el.guidanceVerdictBadge  = document.getElementById("guidance-verdict-badge");
  el.mascotBubbleText      = document.getElementById("mascot-bubble-text");
  el.guidanceCorrectionCard= document.getElementById("guidance-correction-card");
  el.correctionReason      = document.getElementById("correction-reason");
  el.correctionSuggestion  = document.getElementById("correction-suggestion");

  // Results overlay
  el.resultsOverlay        = document.getElementById("results-overlay");
  el.resultsTitle          = document.getElementById("results-title");
  el.starRating            = document.getElementById("star-rating");
  el.evalPoliteness        = document.getElementById("eval-politeness");
  el.evalSafety            = document.getElementById("eval-safety");
  el.evalRelevance         = document.getElementById("eval-relevance");
  el.nextScenarioBtn       = document.getElementById("next-scenario-btn");
  el.retryScenarioBtn      = document.getElementById("retry-scenario-btn");
  el.chooseAnotherBtn      = document.getElementById("choose-another-btn");

  // Attention overlay
  el.attentionOverlay      = document.getElementById("attention-overlay");
  el.attentionMascot       = document.getElementById("attention-mascot");
  el.attentionNameDisplay  = document.getElementById("attention-name-display");
  el.attentionPromptText   = document.getElementById("attention-prompt-text");
}

// ─────────────────────────────────────────────
// BACKEND STATUS CHECK
// ─────────────────────────────────────────────
async function checkBackendStatus() {
  if (!el.backendStatusBadge) return;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const resp = await fetch("http://localhost:8000/health", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (resp.ok) {
      state.backendConnected = true;
      el.backendStatusBadge.className = "backend-status-badge online";
      el.backendStatusBadge.innerHTML = `⚡ Reasoning Engine: <strong>Online (OWL Backend)</strong>`;
      return;
    }
  } catch (err) {
    // Offline or fallback
  }
  state.backendConnected = false;
  el.backendStatusBadge.className = "backend-status-badge offline";
  el.backendStatusBadge.innerHTML = `⚡ Reasoning Engine: <strong>In-Browser Fallback</strong>`;
}

// ─────────────────────────────────────────────
// SCREEN TRANSITIONS
// ─────────────────────────────────────────────
const SCENES = { teacher: "🏫 Classroom", parent: "🏠 Living Room", friend: "🛝 Playground", stranger: "🏙️ Sidewalk" };

function showScreen(name) {
  el.screenLanding.classList.remove("active-screen");
  el.screenCharSelect.classList.remove("active-screen");
  el.screenGameplay.classList.remove("active-screen");

  if (name === "LANDING")          el.screenLanding.classList.add("active-screen");
  else if (name === "CHAR_SELECT") el.screenCharSelect.classList.add("active-screen");
  else if (name === "GAMEPLAY")    el.screenGameplay.classList.add("active-screen");

  state.screen = name;
  checkBackendStatus();
}

function goToLanding() {
  window.speechSynthesis.cancel();
  stopRecording();
  hideMascotCard();
  if (window.AttentionSystem) window.AttentionSystem.stop();
  hideAttentionAlert();
  state.currentModuleId  = null;
  state.currentScenario  = null;
  state.pipelineResult   = null;
  state.transcriptText   = "";
  
  el.screenGameplay.className = "screen";
  showScreen("LANDING");
}

function goToCharacterSelect() {
  window.speechSynthesis.cancel();
  renderHomeAvatars();
  el.screenGameplay.className = "screen";
  showScreen("CHAR_SELECT");
}

function startGameplay(moduleId) {
  state.currentModuleId  = moduleId;
  state.currentScenario  = window.scenarios[moduleId];
  const mod = state.currentScenario;
  if (!mod) { console.error("Scenario not found:", moduleId); return; }

  // Reset state
  state.characterEmotion = mod.initialEmotion;
  state.mascotEmotion    = "neutral";
  state.transcriptText   = "";
  state.pipelineResult   = null;
  state.isRecording      = false;

  // Update UI labels
  el.gameplayTitle.innerText    = `${mod.name} Scenario`;
  el.gameplaySubtitle.innerText = mod.introText;
  el.sceneLabel.innerText       = SCENES[moduleId] || mod.sceneName;

  // Set scene background and screen theme colour
  el.gameplayStage.className = `stage ${mod.bgClass}`;
  el.screenGameplay.className = `screen active-screen playing-${mod.bgClass.replace('scene-', '')}`;

  // Load bilingual question
  el.dialogueSpeakerName.innerText = mod.characterName;
  el.dialogueTanglish.innerText    = mod.tanglishQuestion || mod.question;
  el.dialogueTamil.innerText       = mod.tamilQuestion    || "";

  // Render AAC Picture Hints
  renderVisualHints(mod);

  // Reset input UI
  el.sttPreviewRow.style.display = "none";
  el.sttPreviewText.innerText    = "";
  if (el.textInput) el.textInput.value = "";
  el.micStatus.innerText         = "Listen to the question, then tap to speak or pick a card! 🎙️";
  el.micBtn.classList.remove("recording");
  el.waveform.style.display      = "none";

  // Hide results overlay
  el.resultsOverlay.style.display = "none";
  hideMascotCard();

  // Render characters
  renderCharacters();

  showScreen("GAMEPLAY");

  // Speak question immediately within 100ms on entering page
  setTimeout(() => speakPrompt(), 100);

  // Start attention tracking
  if (window.AttentionSystem) {
    window.AttentionSystem.reset();
    window.AttentionSystem.start(showAttentionAlert, hideAttentionAlert);
  }
}

// ─────────────────────────────────────────────
// AAC VISUAL CARTOON HINT CARDS
// ─────────────────────────────────────────────
function renderVisualHints(currentMod) {
  if (!el.visualHintsGrid || !currentMod) return;
  el.visualHintsGrid.innerHTML = "";

  if (!currentMod.visualHints || currentMod.visualHints.length === 0) {
    if (el.visualHintsCard) el.visualHintsCard.style.display = "none";
    return;
  }

  if (el.visualHintsCard) el.visualHintsCard.style.display = "block";

  currentMod.visualHints.forEach(hint => {
    const card = document.createElement("div");
    card.className = "hint-card";
    card.style.borderColor = hint.color || "#3b82f6";
    card.innerHTML = `
      <div class="hint-icon">${hint.icon}</div>
      <div class="hint-label">${hint.label}</div>
    `;

    card.onclick = () => {
      card.style.transform = "scale(0.92)";
      setTimeout(() => { card.style.transform = ""; }, 150);
      
      if (el.textInput) el.textInput.value = hint.fullText;
      state.transcriptText = hint.fullText;
      
      if (el.micStatus) {
        el.micStatus.innerText = `Selected: "${hint.label}". Sending answer... 🚀`;
      }

      submitAnswer(hint.fullText);
    };

    el.visualHintsGrid.appendChild(card);
  });
}

// ─────────────────────────────────────────────
// LANDING – TAB SWITCHING
// ─────────────────────────────────────────────
function initLandingTabs() {
  el.tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      el.tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active-tab"));
      document.getElementById(`panel-${tab}`).classList.add("active-tab");
      if (tab === "progress") renderProgressPanel();
    });
  });
}

// ─────────────────────────────────────────────
// PROGRESS PANEL
// ─────────────────────────────────────────────
function renderProgressPanel() {
  const data = window.progressData;
  const all  = data ? data.getStats() : null;

  if (!data || !all || all.count === 0) {
    el.progressOverview.innerHTML = `
      <div class="progress-empty-state">
        <div class="empty-icon">🌱</div>
        <h3>No sessions yet!</h3>
        <p>Complete a session to begin tracking your child's progress here.</p>
      </div>`;
    el.sessionLog.innerHTML = "";
    return;
  }

  const totalStars  = all.sessions.reduce((a, s) => a + s.stars, 0);
  const maxStars    = all.count * 5;
  const pct         = Math.round((totalStars / maxStars) * 100);

  el.progressOverview.innerHTML = `
    <div class="progress-stat-grid">
      <div class="stat-card"><div class="stat-num" style="color:#6366f1">${all.count}</div><div class="stat-label">Sessions Played</div></div>
      <div class="stat-card"><div class="stat-num" style="color:#f59e0b">${all.avgStars} ★</div><div class="stat-label">Average Stars</div></div>
      <div class="stat-card"><div class="stat-num" style="color:#10b981">${pct}%</div><div class="stat-label">Overall Score</div></div>
    </div>`;

  const rows = all.sessions.slice().reverse().map(s => `
    <tr>
      <td>${new Date(s.timestamp).toLocaleTimeString()}</td>
      <td><strong>${s.characterName}</strong></td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.userText || "—"}</td>
      <td class="log-stars">${"★".repeat(s.stars)}${"☆".repeat(5 - s.stars)}</td>
    </tr>`).join("");

  el.sessionLog.innerHTML = `
    <table class="session-log-table">
      <thead><tr><th>Time</th><th>Character</th><th>Response</th><th>Stars</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─────────────────────────────────────────────
// AVATAR RENDERING
// ─────────────────────────────────────────────
function renderHomeAvatars() {
  ["teacher", "parent", "friend", "stranger"].forEach(id => {
    const el_ = document.getElementById(`avatar-${id}`);
    if (el_) el_.innerHTML = getCharacterSVG(id, "happy", false);
  });
}

function renderCharacters() {
  if (state.currentScenario) {
    el.characterContainer.innerHTML = getCharacterSVG(state.currentScenario.id, state.characterEmotion, state.characterIsTalking);
  } else {
    el.characterContainer.innerHTML = "";
  }
  el.mascotContainer.innerHTML = getCharacterSVG("mascot", state.mascotEmotion, state.mascotIsTalking);
}

// ─────────────────────────────────────────────
// TTS / SPEECH
// ─────────────────────────────────────────────
const SOFT_VOICE_PRIORITY = [
  "Samantha","Karen","Moira","Tessa","Fiona",
  "Google UK English Female","Microsoft Libby","Microsoft Aria","Microsoft Jenny","Microsoft Zira","Google US English"
];

function populateVoices() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (!el.voiceSelect) return;
  el.voiceSelect.innerHTML = "";

  if (!state.voice) {
    for (const pref of SOFT_VOICE_PRIORITY) {
      const m = voices.find(v => v.name.includes(pref) && v.lang.startsWith("en"));
      if (m) { state.voice = m; break; }
    }
    if (!state.voice) {
      state.voice = voices.find(v => v.lang === "en-GB" || v.lang === "en-AU")
                 ?? voices.find(v => v.lang.startsWith("en-"))
                 ?? voices[0];
    }
  }

  voices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${v.name} (${v.lang})`;
    if (state.voice && v.name === state.voice.name) opt.selected = true;
    el.voiceSelect.appendChild(opt);
  });
}

function getVoiceForCharacter(characterId) {
  const voices = window.speechSynthesis.getVoices();

  if (characterId === "parent" || characterId === "dad") {
    const maleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes("male") || name.includes("david") || name.includes("george") || name.includes("mark") || name.includes("ravi") || name.includes("prabhat");
    });
    return { voice: maleVoice || null, pitch: 0.60, rate: 0.82 };
  } 
  else if (characterId === "teacher") {
    const femaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes("female") || name.includes("zira") || name.includes("hazel") || name.includes("heera") || name.includes("sangeeta");
    });
    return { voice: femaleVoice || null, pitch: 1.15, rate: 0.85 };
  } 
  else if (characterId === "friend") {
    const childVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes("child") || name.includes("kid") || name.includes("boy") || name.includes("samantha") || name.includes("karen");
    });
    return { voice: childVoice || null, pitch: 1.45, rate: 0.90 };
  } 
  else if (characterId === "stranger") {
    const elderVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes("female") || name.includes("heera") || name.includes("veena") || name.includes("zira");
    });
    return { voice: elderVoice || null, pitch: 0.80, rate: 0.75 };
  }

  return { voice: null, pitch: 1.0, rate: 0.85 };
}

function speakClauses(clauses, index, onStart, onEnd, opts) {
  if (index >= clauses.length) {
    if (onEnd) onEnd();
    return;
  }

  const rawClause = clauses[index].trim();
  if (!rawClause) {
    speakClauses(clauses, index + 1, onStart, onEnd, opts);
    return;
  }

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const utt = new SpeechSynthesisUtterance(rawClause);

  if (opts.voice) {
    utt.voice = opts.voice;
  } else if (state.voice) {
    utt.voice = state.voice;
  }

  utt.rate   = opts.rate  ?? 0.82;
  utt.pitch  = opts.pitch ?? 1.0;
  utt.volume = 1.0;

  if (index === 0 && onStart) onStart();

  utt.onend = () => {
    setTimeout(() => {
      speakClauses(clauses, index + 1, onStart, onEnd, opts);
    }, 400);
  };

  utt.onerror = (e) => {
    console.error("TTS clause error:", e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utt);
}

function speakText(text, onStart, onEnd, opts = {}) {
  if (state.isMuted) { if (onStart) onStart(); setTimeout(() => { if (onEnd) onEnd(); }, 800); return; }
  
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();
  }

  const clauses = text.split(/(?<=[!?,.;])\s+/) || [text];
  setTimeout(() => speakClauses(clauses, 0, onStart, onEnd, opts), 60);
}

function speakPrompt() {
  if (!state.currentScenario) return;
  const mod = state.currentScenario;
  const vConfig = getVoiceForCharacter(mod.id);

  speakText(
    mod.audioPrompt,
    () => { state.characterIsTalking = true;  renderCharacters(); },
    () => { state.characterIsTalking = false; renderCharacters(); },
    { voice: vConfig.voice || state.voice, pitch: vConfig.pitch, rate: vConfig.rate }
  );
}

// ─────────────────────────────────────────────
// SPEECH RECOGNITION (STT)
// ─────────────────────────────────────────────
function initSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    console.warn("[STT] Speech Recognition not supported. Showing fallback.");
    if (el.micStatus) el.micStatus.innerText = "🎙️ Mic unsupported. Tap an AAC picture card or type your answer!";
    return;
  }
  state.recognition = new SR();
  state.recognition.continuous    = false;
  state.recognition.interimResults = false;
  state.recognition.lang           = "ta-IN,en-IN,en-US";

  state.recognition.onstart = () => {
    state.isRecording = true;
    el.micBtn.classList.add("recording");
    el.waveform.style.display  = "flex";
    el.micStatus.innerText     = "🎙️ Listening… Speak to Buddy now!";
    el.sttPreviewRow.style.display = "none";
  };

  state.recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    state.transcriptText = text;
    el.sttPreviewText.innerText    = `"${text}"`;
    el.sttPreviewRow.style.display = "flex";
    el.micStatus.innerText         = "✅ Got it! Tap Submit to see what Buddy thinks.";
  };

  state.recognition.onerror = (event) => {
    console.error("[STT] Error:", event.error);
    el.micStatus.innerText = `⚠️ Microphone error: ${event.error}. Try again or tap an AAC card!`;
    stopRecording();
  };

  state.recognition.onend = () => stopRecording();
}

function startRecording() {
  if (!state.recognition) {
    el.micStatus.innerText = "🎙️ Mic unavailable — type your response or tap an AAC card below.";
    el.sttPreviewRow.style.display = "flex";
    return;
  }
  if (state.isRecording) return;
  try {
    window.speechSynthesis.cancel();
    state.characterIsTalking = false;
    state.mascotIsTalking    = false;
    renderCharacters();
    state.recognition.start();
  } catch (e) { console.error(e); }
}

function stopRecording() {
  if (!state.isRecording) return;
  state.isRecording = false;
  if (el.micBtn) el.micBtn.classList.remove("recording");
  if (el.waveform) el.waveform.style.display = "none";
  try { if (state.recognition) state.recognition.stop(); } catch(e) {}
}

// ─────────────────────────────────────────────
// PIPELINE & EVALUATION
// ─────────────────────────────────────────────
async function submitAnswer(overrideText) {
  const text = (overrideText && overrideText.trim())
             || state.transcriptText.trim()
             || (el.sttPreviewText ? el.sttPreviewText.innerText.replace(/^"|"$/g,"").trim() : "")
             || (el.textInput ? el.textInput.value.trim() : "");

  if (!text) {
    el.micStatus.innerText = "⚠️ Please speak, type an answer, or tap an AAC card first!";
    return;
  }

  // Disable inputs
  el.micBtn.style.pointerEvents = "none";
  if (el.submitBtn) el.submitBtn.disabled = true;
  if (el.textSubmitBtn) el.textSubmitBtn.disabled = true;
  el.micStatus.innerText = "💭 Buddy is processing your response...";

  // Run pipeline (asynchronously with Python FastAPI OWL backend if connected)
  state.pipelineResult = await window.runFullPipelineAsync(state.currentModuleId, text);

  // Show thinking state for 800ms, then deliver feedback
  state.mascotEmotion = "neutral";
  renderCharacters();

  setTimeout(() => showMascotFeedback(), 800);
}

function showMascotFeedback() {
  const result = state.pipelineResult;
  if (!result) return;

  const llm = result.llm;
  const stars = llm.scores.overall;

  // Update character emotion
  state.characterEmotion = llm.characterEmotion;
  state.mascotEmotion    = llm.scores.safety <= 3 ? "concerned" : "happy";
  renderCharacters();

  // Determine verdict type
  const linguistic = result.linguistic;
  let verdictClass = "pass";
  let verdictText  = "✅ Great Answer!";

  if (result.ontology && result.ontology.pythonBackendActive) {
    verdictText += " ⚡ [OWL Ontology]";
  }

  if (linguistic && linguistic.verdict === "FAIL") {
    verdictClass = "fail";
    if (linguistic.failType === "DISRESPECT")   verdictText = "❌ Disrespectful Phrase Detected";
    else if (linguistic.failType === "SLANG")    verdictText = "❌ Too Casual / Slang Detected";
    else if (linguistic.failType === "BLUNT_VERB") verdictText = "❌ Blunt Command Detected";
  } else if (linguistic && linguistic.verdict === "WARNING") {
    verdictClass = "warning";
    verdictText  = "⚠️ Missing Politeness Marker";
  } else if (stars <= 2) {
    verdictClass = "fail";
    verdictText  = "❌ Needs Improvement";
  } else if (stars <= 3) {
    verdictClass = "warning";
    verdictText  = "⚠️ Almost There!";
  }

  // Update guidance card
  el.guidanceVerdictBadge.className = `guidance-verdict-badge ${verdictClass}`;
  el.guidanceVerdictBadge.innerText = verdictText;
  el.mascotBubbleText.innerText     = llm.mascotFeedback;

  // Show linguistic or ontology correction card if applicable
  if (linguistic && linguistic.verdict !== "PASS" && linguistic.suggestion) {
    el.guidanceCorrectionCard.style.display = "block";
    const reasonMap = {
      DISRESPECT:       "🚫 Disrespect Shield: A rude/offensive word was detected in your response.",
      SLANG:            "🚫 Slang Filter: A casual particle that is too informal for this context was detected.",
      BLUNT_VERB:       "🚫 Blunt Verb Gate: A command verb was used without the polite honorific form.",
      MISSING_HONORIFIC:"⚠️ Honorific Check: A polite form of address (Sir, nga, please) was missing."
    };
    el.correctionReason.innerText     = reasonMap[linguistic.failType] || "A linguistic issue was detected.";
    el.correctionSuggestion.innerText = linguistic.suggestion;
  } else if (result.ontology && result.ontology.hasViolations) {
    el.guidanceCorrectionCard.style.display = "block";
    el.correctionReason.innerText = "⚡ OWL Ontology Rule Violation";
    el.correctionSuggestion.innerText = result.ontology.suggestedFeedback || "Check politeness and safety rules!";
  } else {
    el.guidanceCorrectionCard.style.display = "none";
  }

  // Render mascot into guidance card
  el.guidanceMascot.innerHTML = getCharacterSVG("mascot", state.mascotEmotion, true);

  // Slide up guidance card
  el.mascotGuidanceCard.classList.add("slide-up");

  // Speak feedback
  speakText(
    llm.mascotFeedback.replace(/\n/g, " ").substring(0, 280),
    () => { state.mascotIsTalking = true;  el.guidanceMascot.innerHTML = getCharacterSVG("mascot", state.mascotEmotion, true); },
    () => {
      state.mascotIsTalking = false;
      el.guidanceMascot.innerHTML = getCharacterSVG("mascot", state.mascotEmotion, false);
      setTimeout(() => showResultsOverlay(), 800);
    }
  );
}

function showResultsOverlay() {
  const result = state.pipelineResult;
  if (!result) return;
  const { scores } = result.llm;
  const stars = scores.overall;

  el.evalPoliteness.innerText = `${scores.politeness}/10`;
  el.evalSafety.innerText     = `${scores.safety}/10`;
  el.evalRelevance.innerText  = `${scores.relevance}/10`;

  // Star display
  el.starRating.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement("span");
    s.className = `star ${i <= stars ? "active-star" : ""}`;
    s.innerText = "★";
    s.style.animationDelay = `${i * 0.12}s`;
    el.starRating.appendChild(s);
  }

  // Show/hide Next Level button
  el.nextScenarioBtn.style.display = stars >= 4 ? "inline-flex" : "none";
  el.resultsTitle.innerText = stars >= 4 ? "Fantastic! 🎉" : stars >= 3 ? "Good Effort! 👍" : "Keep Practicing! 💪";

  // Re-enable input controls
  el.micBtn.style.pointerEvents = "auto";
  if (el.submitBtn) el.submitBtn.disabled = false;
  if (el.textSubmitBtn) el.textSubmitBtn.disabled = false;

  el.resultsOverlay.style.display = "flex";
}

function hideMascotCard() {
  el.mascotGuidanceCard.classList.remove("slide-up");
}

// ─────────────────────────────────────────────
// ATTENTION ALERTS
// ─────────────────────────────────────────────
function showAttentionAlert() {
  if (state.attentionAlertActive) return;
  state.attentionAlertActive = true;
  window.speechSynthesis.cancel();
  el.attentionMascot.innerHTML = getCharacterSVG("mascot-waving", "happy", false);
  el.attentionNameDisplay.innerText = `Hey, ${state.childName}! 👋`;
  el.attentionPromptText.innerText  = `It's okay! Take your time. Buddy is right here waiting for you!`;
  el.attentionOverlay.style.display = "flex";
  speakText(`Hey ${state.childName}… come back. Buddy is right here!`, null, null, { rate:.78, pitch:1.12 });
}

function hideAttentionAlert() {
  if (!state.attentionAlertActive) return;
  state.attentionAlertActive = false;
  el.attentionOverlay.style.display = "none";
  if (state.screen === "GAMEPLAY" && state.currentScenario) {
    setTimeout(() => speakText(`Welcome back, ${state.childName}! Let's continue.`, null, () => speakPrompt()), 400);
  }
}

// ─────────────────────────────────────────────
// EVENT BINDINGS
// ─────────────────────────────────────────────
function bindEvents() {
  initLandingTabs();

  el.btnStartSession.addEventListener("click", goToCharacterSelect);

  el.btnBackFromSelect.addEventListener("click", goToLanding);
  el.btnBackFromGame.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    stopRecording();
    hideMascotCard();
    if (window.AttentionSystem) window.AttentionSystem.stop();
    goToLanding();
  });

  document.querySelectorAll(".char-card").forEach(card => {
    card.addEventListener("click", () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.resume();
        try {
          const dummyUtterance = new SpeechSynthesisUtterance("");
          dummyUtterance.volume = 0;
          window.speechSynthesis.speak(dummyUtterance);
        } catch (e) {}
      }
      const moduleId = card.getAttribute("data-module");
      if (moduleId) startGameplay(moduleId);
    });
  });

  // Giant mic button
  el.micBtn.addEventListener("click", () => {
    if (state.isRecording) stopRecording();
    else startRecording();
  });

  // Submit buttons
  if (el.submitBtn) {
    el.submitBtn.addEventListener("click", () => {
      stopRecording();
      submitAnswer();
    });
  }

  if (el.textSubmitBtn) {
    el.textSubmitBtn.addEventListener("click", () => {
      stopRecording();
      submitAnswer();
    });
  }

  if (el.textInput) {
    el.textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        stopRecording();
        submitAnswer();
      }
    });
  }

  // Replay question button
  el.replayBtn.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    speakPrompt();
  });

  // Results overlay actions
  el.retryScenarioBtn.addEventListener("click", () => {
    el.resultsOverlay.style.display = "none";
    hideMascotCard();
    if (state.currentModuleId) startGameplay(state.currentModuleId);
  });
  el.nextScenarioBtn.addEventListener("click", () => goToCharacterSelect());
  el.chooseAnotherBtn.addEventListener("click", () => goToCharacterSelect());

  // Settings – voice select
  el.voiceSelect.addEventListener("change", () => {
    const voices = window.speechSynthesis.getVoices();
    state.voice = voices[parseInt(el.voiceSelect.value)];
  });

  // Settings – mute
  el.muteToggle.addEventListener("change", (e) => {
    state.isMuted = e.target.checked;
    if (state.isMuted) window.speechSynthesis.cancel();
  });

  // Settings – child name
  el.childNameInput.addEventListener("input", (e) => {
    const v = e.target.value.trim();
    state.childName = v.length > 0 ? v : "Friend";
  });

  // Attention overlay click-to-dismiss
  el.attentionOverlay.addEventListener("click", hideAttentionAlert);
}

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  initElements();
  bindEvents();
  initSpeechRecognition();
  checkBackendStatus();

  // Load TTS voices
  if (window.speechSynthesis) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    populateVoices();
  }

  // Init attention detection (non-blocking)
  if (window.AttentionSystem) {
    const ok = await window.AttentionSystem.init();
    if (el.attentionStatus) {
      el.attentionStatus.className = `attention-status-badge ${ok ? "ok" : "off"}`;
      el.attentionStatus.innerText = ok ? "✅ Attention detection active" : "⚠️ Camera unavailable — attention detection off";
    }
  }

  showScreen("LANDING");
});
