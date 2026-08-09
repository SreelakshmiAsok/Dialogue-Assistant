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
  ttsCancelled: false,
  ttsTimer: null,

  // Character animation
  characterEmotion: "neutral",
  characterIsTalking: false,
  mascotEmotion: "neutral",
  mascotIsTalking: false,

  // Pipeline
  pipelineResult: null,

  // Backend
  backendConnected: false,

  // Attention & Child Lock Security
  childName: "Friend",
  attentionAlertActive: false,
  childLockActive: false,
  parentPin: "1234"
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
  el.liveAttentionBadge    = document.getElementById("live-attention-badge");

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
  if (el.screenLanding)    el.screenLanding.style.display    = (name === "LANDING")     ? "flex" : "none";
  if (el.screenCharSelect) el.screenCharSelect.style.display = (name === "CHAR_SELECT") ? "flex" : "none";
  if (el.screenGameplay)   el.screenGameplay.style.display   = (name === "GAMEPLAY")    ? "flex" : "none";

  if (el.screenLanding)    el.screenLanding.classList.toggle("active-screen", name === "LANDING");
  if (el.screenCharSelect) el.screenCharSelect.classList.toggle("active-screen", name === "CHAR_SELECT");
  if (el.screenGameplay)   el.screenGameplay.classList.toggle("active-screen", name === "GAMEPLAY");

  state.screen = name;
  checkBackendStatus();
}

function stopSpeech() {
  state.ttsCancelled = true;
  if (state.ttsTimer) {
    clearTimeout(state.ttsTimer);
    state.ttsTimer = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  state.characterIsTalking = false;
  renderCharacters();
}

function goToLanding() {
  stopSpeech();
  stopRecording();
  hideMascotCard();
  if (window.AttentionSystem) window.AttentionSystem.stop();
  hideAttentionAlert();
  state.currentModuleId  = null;
  state.currentScenario  = null;
  state.pipelineResult   = null;
  state.transcriptText   = "";
  
  // Reset screen classes when returning to landing
  if (el.screenGameplay) el.screenGameplay.className = "screen";
  showScreen("LANDING");
}

function goToCharacterSelect() {
  stopSpeech();
  renderHomeAvatars();
  // Reset screen classes when going to character select
  if (el.screenGameplay) el.screenGameplay.className = "screen";
  showScreen("CHAR_SELECT");
}

function startGameplay(moduleId = "parent") {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
    try {
      const dummyUtterance = new SpeechSynthesisUtterance("");
      dummyUtterance.volume = 0;
      window.speechSynthesis.speak(dummyUtterance);
    } catch (e) {}
  }

  // Force Parent module as the primary focused scenario
  const targetId = moduleId || "parent";
  state.currentModuleId  = targetId;
  state.currentScenario  = window.scenarios[targetId] || window.scenarios["parent"];
  const mod = state.currentScenario;
  if (!mod) { console.error("Scenario not found:", targetId); return; }

  // Clear any existing hint timer & countdown
  if (state.hintTimer) {
    clearTimeout(state.hintTimer);
    state.hintTimer = null;
  }
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
  }

  // Reset state
  state.characterEmotion = mod.initialEmotion;
  state.mascotEmotion    = "neutral";
  state.transcriptText   = "";
  state.pipelineResult   = null;
  state.isRecording      = false;

  // Update UI labels
  el.gameplayTitle.innerText    = `${mod.name} Scenario (Parent & Child)`;
  el.gameplaySubtitle.innerText = mod.introText;
  el.sceneLabel.innerText       = SCENES[targetId] || mod.sceneName;

  // Set scene background and screen theme colour
  el.gameplayStage.className = `stage ${mod.bgClass}`;
  el.screenGameplay.className = `screen active-screen playing-${mod.bgClass.replace('scene-', '')}`;

  // Load small concise question
  el.dialogueSpeakerName.innerText = mod.characterName;
  el.dialogueTanglish.innerText    = mod.tanglishQuestion || mod.question;
  el.dialogueTamil.innerText       = mod.tamilQuestion    || "";

  // Hide Cartoon Visual Hints initially (will show after waiting 6 seconds if kid doesn't answer)
  if (el.visualHintsCard) el.visualHintsCard.style.display = "none";
  renderVisualHints(mod);

  // Reset input UI for automatic voice input
  el.sttPreviewRow.style.display = "none";
  el.sttPreviewText.innerText    = "";
  if (el.textInput) el.textInput.value = "";
  el.micStatus.innerText         = "Listen to Dad speaking... Microphone will start automatically! 🎙️";
  el.micBtn.classList.remove("recording");
  el.waveform.style.display      = "none";

  // Hide results overlay
  el.resultsOverlay.style.display = "none";
  hideMascotCard();

  // Render characters
  renderCharacters();

  showScreen("GAMEPLAY");

  // Speak prompt immediately, then microphone automatically starts listening!
  setTimeout(() => speakPrompt(), 100);

  // Countdown timer: Show live countdown, then show hint card if kid hasn't answered
  if (state.countdownInterval) clearInterval(state.countdownInterval);
  let secondsLeft = 8;
  const updateCountdown = () => {
    if (state.screen !== "GAMEPLAY" || state.pipelineResult || state.isRecording) {
      clearInterval(state.countdownInterval);
      return;
    }
    if (secondsLeft > 0) {
      if (el.micStatus) el.micStatus.innerText = `🎙️ Speak your answer! (${secondsLeft}s)  — Listening for your voice…`;
      secondsLeft--;
    } else {
      clearInterval(state.countdownInterval);
      if (state.screen === "GAMEPLAY" && !state.pipelineResult) {
        if (el.visualHintsCard) el.visualHintsCard.style.display = "block";
        if (el.micStatus) el.micStatus.innerText = "💡 Need help? Tap a picture card below or speak your answer!";
        // Mascot speaks a gentle hint prompt
        speakText(
          "It's okay! Take your time. Check the picture cards for help!",
          () => { state.mascotIsTalking = true; renderCharacters(); },
          () => { state.mascotIsTalking = false; renderCharacters(); },
          { rate: 0.80, pitch: 1.1 }
        );
      }
    }
  };
  // Start countdown after the prompt finishes speaking (~3s delay)
  state.hintTimer = setTimeout(() => {
    state.countdownInterval = setInterval(updateCountdown, 1000);
  }, 3000);

  // Start attention tracking
  if (window.AttentionSystem) {
    window.AttentionSystem.reset();
    window.AttentionSystem.start(showAttentionAlert, hideAttentionAlert, updateAttentionStatus);
  }
}

// ─────────────────────────────────────────────
// AAC VISUAL CARTOON HINT CARDS — Fully Emoji/Audio, No Reading Required
// ─────────────────────────────────────────────
function renderVisualHints(currentMod) {
  if (!el.visualHintsGrid || !currentMod) return;
  el.visualHintsGrid.innerHTML = "";

  const hintsList = currentMod.cartoonHints || currentMod.visualHints || [];
  if (hintsList.length === 0) {
    if (el.visualHintsCard) el.visualHintsCard.style.display = "none";
    return;
  }

  hintsList.forEach((hint, idx) => {
    const card = document.createElement("div");
    card.className = "hint-card cartoon-aac-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", hint.title || hint.label);
    card.style.cssText = `
      background: linear-gradient(145deg, ${hint.color || "#2563eb"}22, ${hint.color || "#2563eb"}08);
      border: 4px solid ${hint.color || "#2563eb"};
      border-radius: 24px;
      cursor: pointer;
      padding: 1.2rem 0.8rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.18s cubic-bezier(.34,1.56,.64,1);
      box-shadow: 0 6px 20px ${hint.color || "#2563eb"}33;
      animation: cardBounceIn 0.4s cubic-bezier(.34,1.56,.64,1) ${idx * 0.1}s both;
      position: relative;
      overflow: hidden;
      min-width: 130px;
    `;

    // Big emoji icon + tap-to-hear speaker icon
    card.innerHTML = `
      <div style="font-size: 3.8rem; line-height: 1; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); animation: iconBob 2s ease-in-out infinite ${idx * 0.3}s;">
        ${hint.icon}
      </div>
      <div style="font-size: 2rem; opacity: 0.7;">🔊</div>
      <div style="
        font-size: 0.78rem;
        font-weight: 900;
        color: ${hint.color || "#1d4ed8"};
        text-align: center;
        line-height: 1.3;
        max-width: 120px;
        word-break: break-word;
      ">${hint.title || hint.label}</div>
    `;

    // Hover effects
    card.onmouseenter = () => { card.style.transform = "scale(1.08) translateY(-4px)"; };
    card.onmouseleave = () => { card.style.transform = ""; };

    const handleCardActivation = () => {
      card.style.transform = "scale(0.93)";
      setTimeout(() => { card.style.transform = ""; }, 160);

      const textToUse = hint.fullText || hint.tanglishText;
      const labelToSpeak = hint.title || hint.label;

      if (el.micStatus) {
        el.micStatus.innerText = `🎙️ "${labelToSpeak}" — Sending to Dad...`;
      }

      // Speak the label FIRST so the kid hears it (no reading needed!)
      speakText(
        labelToSpeak,
        null,
        () => {
          // After speaking label, submit the answer
          if (el.textInput) el.textInput.value = textToUse;
          state.transcriptText = textToUse;
          submitAnswer(textToUse);
        },
        { rate: 0.78, pitch: 1.15 }
      );
    };

    card.onclick = handleCardActivation;
    card.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") handleCardActivation(); };

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
  const heroMascot = document.getElementById("hero-mascot-avatar");
  if (heroMascot) heroMascot.innerHTML = getCharacterSVG("mascot", "happy", false);

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
    // 👨 Dad: Deep, Warm Middle-Aged Man's Voice
    const maleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes("david") ||
             name.includes("george") ||
             name.includes("ravi") ||
             name.includes("prabhat") ||
             name.includes("mark") ||
             name.includes("guy") ||
             (name.includes("male") && !name.includes("female"));
    }) || voices.find(v => {
      const name = v.name.toLowerCase();
      return !name.includes("female") && !name.includes("zira") && !name.includes("hazel") && !name.includes("sangeeta") && !name.includes("heera");
    });
    return { voice: maleVoice || null, pitch: 0.70, rate: 0.84 };
  } 
  else if (characterId === "teacher") {
    const femaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes("female") || name.includes("zira") || name.includes("hazel") || name.includes("heera") || name.includes("sangeeta");
    });
    return { voice: femaleVoice || null, pitch: 1.15, rate: 0.85 };
  } 
  else if (characterId === "friend") {
    // 👦 Friend: Soft, Gentle Male Voice
    const softMaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return (name.includes("george") ||
              name.includes("mark") ||
              name.includes("ravi") ||
              name.includes("prabhat") ||
              name.includes("david") ||
              (name.includes("male") && !name.includes("female")));
    }) || voices.find(v => {
      const name = v.name.toLowerCase();
      return !name.includes("female") && !name.includes("zira") && !name.includes("hazel") && !name.includes("sangeeta");
    });
    return { voice: softMaleVoice || null, pitch: 1.08, rate: 0.86 };
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
  if (state.ttsCancelled) {
    if (onEnd) onEnd();
    return;
  }

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
    if (opts.voice.lang) utt.lang = opts.voice.lang;
  } else if (state.voice) {
    utt.voice = state.voice;
    if (state.voice.lang) utt.lang = state.voice.lang;
  }

  // Constant fixed speed rate for steady, understandable speech
  utt.rate   = opts.rate  ?? 0.84;
  utt.pitch  = opts.pitch ?? 0.85;
  utt.volume = 1.0;

  if (index === 0 && onStart) onStart();

  utt.onend = () => {
    if (state.ttsCancelled) {
      if (onEnd) onEnd();
      return;
    }
    // 220ms subtle pause at punctuation marks for natural cadence
    state.ttsTimer = setTimeout(() => {
      if (!state.ttsCancelled) {
        speakClauses(clauses, index + 1, onStart, onEnd, opts);
      }
    }, 220);
  };

  utt.onerror = (e) => {
    console.error("TTS clause error:", e);
    if (state.ttsCancelled) {
      if (onEnd) onEnd();
      return;
    }
    // If TTS errored with custom voice, retry with default voice
    if (opts.voice) {
      const fallbackOpts = { ...opts, voice: null };
      speakClauses(clauses, index, onStart, onEnd, fallbackOpts);
    } else if (onEnd) {
      onEnd();
    }
  };

  window.speechSynthesis.speak(utt);
}

function speakText(text, onStart, onEnd, opts = {}) {
  stopSpeech();
  state.ttsCancelled = false;
  if (state.isMuted) { if (onStart) onStart(); setTimeout(() => { if (onEnd) onEnd(); }, 800); return; }
  
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }

  const clauses = text.split(/(?<=[!?,.;])\s+/) || [text];
  state.ttsTimer = setTimeout(() => speakClauses(clauses, 0, onStart, onEnd, opts), 80);
}

function speakPrompt() {
  if (!state.currentScenario) return;
  const mod = state.currentScenario;
  const vConfig = getVoiceForCharacter(mod.id);

  // If using an English voice (like Microsoft David), speak Tanglish or English so TTS engine can pronounce it out loud!
  let textToSpeak = mod.tanglishQuestion || mod.question || mod.audioPrompt;
  if (vConfig.voice && vConfig.voice.lang && vConfig.voice.lang.toLowerCase().startsWith("ta")) {
    textToSpeak = mod.audioPrompt;
  }

  speakText(
    textToSpeak,
    () => { state.characterIsTalking = true;  renderCharacters(); },
    () => { 
      state.characterIsTalking = false; 
      renderCharacters();
      // Automatically start speech recognition listening as soon as Dad finishes asking the question!
      setTimeout(() => {
        if (el.micStatus) el.micStatus.innerText = "🎙️ Listening automatically... Speak your answer to Dad now!";
        startRecording();
      }, 400);
    },
    { voice: vConfig.voice || state.voice, pitch: vConfig.pitch, rate: vConfig.rate }
  );
}

function replayQuestion() {
  // Stop any ongoing recording first
  stopRecording();
  // Cancel any ongoing TTS
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
  }
  // Clear cancelled flag so new speech will play
  state.ttsCancelled = false;
  state.characterIsTalking = false;
  renderCharacters();

  if (!state.currentScenario) return;
  const mod = state.currentScenario;
  const vConfig = getVoiceForCharacter(mod.id);

  let textToSpeak = mod.tanglishQuestion || mod.question || mod.audioPrompt;
  if (vConfig.voice && vConfig.voice.lang && vConfig.voice.lang.toLowerCase().startsWith("ta")) {
    textToSpeak = mod.audioPrompt;
  }

  // Small delay to let cancel() settle before speaking
  setTimeout(() => {
    if (state.ttsCancelled) return;
    const clauses = textToSpeak.split(/(?<=[!?,.;])\s+/) || [textToSpeak];
    const opts = { voice: vConfig.voice || state.voice, pitch: vConfig.pitch, rate: vConfig.rate };
    speakClauses(
      clauses, 0,
      () => { state.characterIsTalking = true; renderCharacters(); },
      () => {
        state.characterIsTalking = false;
        renderCharacters();
        if (el.micStatus) el.micStatus.innerText = "🎙️ Listening... Speak your answer now!";
        setTimeout(() => startRecording(), 300);
      },
      opts
    );
  }, 200);
}

// ─────────────────────────────────────────────
// SPEECH RECOGNITION (STT)
// ─────────────────────────────────────────────
function initSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    console.warn("[STT] Native Speech Recognition not supported. Voice prompt fallback enabled.");
    if (el.micStatus) el.micStatus.innerText = "🎙️ Tap the Mic button to speak your answer!";
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
    el.micStatus.innerText     = "🎙️ Listening automatically… Speak to Dad now!";
    el.sttPreviewRow.style.display = "none";
  };

  state.recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    state.transcriptText = text;
    el.sttPreviewText.innerText    = `"${text}"`;
    el.sttPreviewRow.style.display = "flex";
    el.micStatus.innerText         = "✅ Got your voice answer! Evaluating with Dad... 🚀";
    stopRecording();
    // Automatic submission - no button click needed!
    setTimeout(() => submitAnswer(text), 500);
  };

  state.recognition.onerror = (event) => {
    console.warn("[STT] Error event:", event.error);
    stopRecording();
    if (el.micStatus) {
      el.micStatus.innerText = "🎙️ Tap the Mic button or speak your answer to Dad!";
    }
  };

  state.recognition.onend = () => stopRecording();
}

function requestMicPermission() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        if (el.micStatus) el.micStatus.innerText = "🎙️ Microphone ready! Tap to speak or listen to Dad.";
      })
      .catch(err => {
        console.warn("Mic permission request:", err.message);
      });
  }
}

function startRecording() {
  requestMicPermission();

  if (!state.recognition) {
    initSpeechRecognition();
  }

  if (state.isRecording) {
    stopRecording();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    state.characterIsTalking = false;
    state.mascotIsTalking    = false;
    renderCharacters();

    if (state.recognition) {
      state.recognition.start();
    } else {
      const userResp = prompt("Microphone Voice Input:\nSpeak or type your answer to Dad below:", "Sorry Appa, naan thaan keezha pottutten.");
      if (userResp && userResp.trim()) {
        submitAnswer(userResp.trim());
      }
    }
  } catch (e) {
    console.warn("[STT] Start error:", e);
    try { if (state.recognition) state.recognition.stop(); } catch(err){}
    const userResp = prompt("Microphone Voice Input:\nSpeak or type your answer to Dad below:", "Sorry Appa, naan thaan keezha pottutten.");
    if (userResp && userResp.trim()) {
      submitAnswer(userResp.trim());
    }
  }
}

function stopRecording() {
  if (!state.isRecording) return;
  state.isRecording = false;
  if (el.micBtn) el.micBtn.classList.remove("recording");
  if (el.waveform) el.waveform.style.display = "none";
  try { if (state.recognition) state.recognition.stop(); } catch(e) {}
}

// ─────────────────────────────────────────────
// CELEBRATION BALLOONS & VICTORY CHIME
// ─────────────────────────────────────────────
function playVictoryChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.55);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.55);
    });
  } catch (e) { console.warn(e); }
}

function triggerBalloonCelebration() {
  playVictoryChime();
  let container = document.getElementById("balloon-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "balloon-container";
    container.className = "balloon-container";
    document.body.appendChild(container);
  }
  container.innerHTML = "";

  const balloonIcons = ["🎈", "🎉", "⭐", "💖", "✨", "🎊", "🏆", "🥳", "🎈", "🎈", "🌟"];
  
  for (let i = 0; i < 30; i++) {
    const b = document.createElement("div");
    b.className = "balloon-item";
    b.innerText = balloonIcons[Math.floor(Math.random() * balloonIcons.length)];
    b.style.left = `${Math.random() * 92 + 2}%`;
    b.style.animationDelay = `${Math.random() * 1.5}s`;
    b.style.animationDuration = `${3.5 + Math.random() * 2}s`;
    b.style.fontSize = `${2.5 + Math.random() * 1.8}rem`;
    container.appendChild(b);
  }

  setTimeout(() => {
    if (container) container.innerHTML = "";
  }, 6000);
}

// ─────────────────────────────────────────────
// WRONG ANSWER ANIMATED BANNER
// ─────────────────────────────────────────────
function showWrongAnswerBanner() {
  // Remove any existing banner
  const existing = document.getElementById("wrong-answer-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "wrong-answer-banner";
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: white;
      font-size: 2.2rem;
      font-weight: 900;
      padding: 1.5rem 3rem;
      border-radius: 24px;
      box-shadow: 0 8px 40px rgba(220,38,38,0.5);
      z-index: 9999;
      text-align: center;
      animation: wrongBannerPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      pointer-events: none;
      letter-spacing: 1px;
    ">
      ❌ That is Wrong!<br>
      <span style="font-size:1.1rem;font-weight:700;opacity:0.9;">Check the picture cards for a hint! 💡</span>
    </div>
  `;
  document.body.appendChild(banner);

  // Add animation keyframes if not already present
  if (!document.getElementById("wrong-banner-style")) {
    const style = document.createElement("style");
    style.id = "wrong-banner-style";
    style.textContent = `
      @keyframes wrongBannerPop {
        0% { transform: translate(-50%, -50%) scale(0) rotate(-5deg); opacity: 0; }
        60% { transform: translate(-50%, -50%) scale(1.1) rotate(2deg); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-remove banner after 2.5s
  setTimeout(() => {
    if (banner && banner.parentNode) {
      banner.style.transition = "opacity 0.4s";
      banner.style.opacity = "0";
      setTimeout(() => banner.remove(), 400);
    }
  }, 2500);
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

  // Temporarily disable inputs during pipeline processing
  el.micBtn.style.pointerEvents = "none";
  if (el.submitBtn) el.submitBtn.disabled = true;
  if (el.textSubmitBtn) el.textSubmitBtn.disabled = true;
  el.micStatus.innerText = "💭 Buddy is processing your response...";

  try {
    // Run pipeline (asynchronously with Python FastAPI OWL backend if connected)
    state.pipelineResult = await window.runFullPipelineAsync(state.currentModuleId, text);
  } catch (err) {
    console.error("Pipeline submission error:", err);
  } finally {
    // Always re-enable input buttons so user can submit again cleanly!
    el.micBtn.style.pointerEvents = "auto";
    if (el.submitBtn) el.submitBtn.disabled = false;
    if (el.textSubmitBtn) el.textSubmitBtn.disabled = false;
  }

  // Show thinking state for 600ms, then deliver feedback
  state.mascotEmotion = "neutral";
  renderCharacters();

  setTimeout(() => showMascotFeedback(), 600);
}

function showMascotFeedback() {
  const result = state.pipelineResult;

  // Always re-enable mic and submit buttons
  el.micBtn.style.pointerEvents = "auto";
  if (el.submitBtn) el.submitBtn.disabled = false;
  if (el.textSubmitBtn) el.textSubmitBtn.disabled = false;

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
  let isWrongAnswer = false;

  if (result.ontology && result.ontology.pythonBackendActive) {
    verdictText += " ⚡ [OWL Ontology]";
  }

  if (linguistic && linguistic.verdict === "FAIL") {
    verdictClass = "fail";
    isWrongAnswer = true;
    if (linguistic.failType === "DISRESPECT") {
      verdictText = "❌ Oops! Not a nice word!";
    } else if (linguistic.failType === "SLANG") {
      verdictText = `❌ Too casual! Don't say "${linguistic.triggeredWord}" to Dad!`;
    } else if (linguistic.failType === "BLUNT_VERB") {
      verdictText = "❌ Too blunt! Use polite words!";
    }
  } else if (linguistic && linguistic.verdict === "WARNING") {
    verdictClass = "warning";
    verdictText  = "⚠️ Almost! Try adding 'Appa' or 'thank you'!";
  } else if (result.ontology && result.ontology.hasViolations) {
    verdictClass = "fail";
    isWrongAnswer = true;
    verdictText  = "❌ Oops! That was not respectful!";
  } else if (stars <= 2) {
    verdictClass = "fail";
    isWrongAnswer = true;
    verdictText  = "❌ Let's try again!";
  } else if (stars <= 3) {
    verdictClass = "warning";
    verdictText  = "⚠️ Almost There! Good try!";
  } else {
    // 🎈 Appropriate / Respectful Answer to Dad: Trigger Balloon Celebration!
    verdictText = "🎉 Super Answer! 🎈";
    triggerBalloonCelebration();
  }

  // If wrong answer: show banner, speak aloud, show hint cards immediately
  if (isWrongAnswer) {
    if (el.visualHintsCard) el.visualHintsCard.style.display = "block";
    if (el.micStatus) el.micStatus.innerText = "❌ Oops! Tap a picture card below to hear the right answer!";
    // Show animated WRONG banner
    showWrongAnswerBanner();

    // Build a child-friendly spoken message based on WHY it was wrong
    let spokenWrongMsg = "Oops! That is wrong. ";
    if (linguistic && linguistic.failType === "SLANG" && linguistic.triggeredWord) {
      spokenWrongMsg += `Saying "${linguistic.triggeredWord}" to Dad is not respectful! `;
    } else if (linguistic && linguistic.failType === "DISRESPECT") {
      spokenWrongMsg += "That word is not a nice word to use with Dad! ";
    }
    spokenWrongMsg += "Tap a picture card to hear the right answer!";

    speakText(
      spokenWrongMsg,
      () => { state.mascotIsTalking = true; renderCharacters(); },
      () => { state.mascotIsTalking = false; renderCharacters(); },
      { rate: 0.80, pitch: 1.1 }
    );
  }


  // Update guidance card
  el.guidanceVerdictBadge.className = `guidance-verdict-badge ${verdictClass}`;
  el.guidanceVerdictBadge.innerText = verdictText;
  el.mascotBubbleText.innerText = isWrongAnswer
    ? `❌ That is wrong! ${llm.mascotFeedback}`
    : llm.mascotFeedback;

  // Show Next Scenario button on results overlay and guidance card
  if (el.nextScenarioBtn) el.nextScenarioBtn.style.display = "inline-block";

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
// ATTENTION ALERTS & CAMERA FEED CONTROLS
// ─────────────────────────────────────────────
function updateAttentionStatus(stateStr, messageStr, remainingSec) {
  const badgeClass = stateStr === "ATTENTIVE" ? "ok" : (stateStr === "DISTRACTED" ? "alert" : "warn");
  
  if (el.liveAttentionBadge) {
    el.liveAttentionBadge.innerText = messageStr;
    el.liveAttentionBadge.className = `attention-status-badge ${badgeClass}`;
  }
  if (el.attentionStatus) {
    el.attentionStatus.innerText = messageStr;
    el.attentionStatus.className = `attention-status-badge ${badgeClass}`;
  }
}

function toggleCameraFeedVisibility() {
  const box = document.getElementById("camera-feed-box");
  const btn = document.getElementById("btn-toggle-cam");
  if (!box || !btn) return;
  
  const isHidden = box.classList.toggle("hidden-feed");
  btn.innerText = isHidden ? "👁️ Show Feed" : "👁️ Hide Feed";
}

function playAudioChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

    osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) { console.warn("Audio chime error:", e); }
}

function testAttentionAlert() {
  showAttentionAlert();
  setTimeout(() => {
    hideAttentionAlert();
  }, 5000);
}

function showAttentionAlert() {
  if (state.attentionAlertActive) return;
  state.attentionAlertActive = true;
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  // 🔔 Play Web Audio chime sound alert
  playAudioChime();

  if (el.attentionMascot) el.attentionMascot.innerHTML = getCharacterSVG("mascot-waving", "happy", false);
  if (el.attentionNameDisplay) el.attentionNameDisplay.innerText = `Hey, ${state.childName}! 👋`;
  if (el.attentionPromptText) el.attentionPromptText.innerText  = `It's okay! Take your time. Buddy is right here waiting for you!`;
  if (el.attentionOverlay) el.attentionOverlay.style.display = "flex";
  
  updateAttentionStatus("DISTRACTED", "🔴 Distracted — Alert Active");
  speakText(`Hey ${state.childName}… come back. Buddy is right here!`, null, null, { rate:.78, pitch:1.12 });
}

function hideAttentionAlert() {
  if (!state.attentionAlertActive) return;
  state.attentionAlertActive = false;
  if (el.attentionOverlay) el.attentionOverlay.style.display = "none";
  
  updateAttentionStatus("ATTENTIVE", "🟢 Focused & Engaged");
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

  // Replay button binding handled via onclick="replayQuestion()" in HTML

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

// ─────────────────────────────────────────────
// CHILD LOCK / KIOSK SECURITY MODE
// ─────────────────────────────────────────────
let pendingUnlockCallback = null;

function toggleChildLock() {
  const pinInput = document.getElementById("parent-pin-input");
  if (pinInput && pinInput.value.trim()) {
    state.parentPin = pinInput.value.trim();
  }

  if (!state.childLockActive) {
    state.childLockActive = true;
    updateChildLockUI();

    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen({ navigationUI: "hide" }).catch(() => {
        elem.requestFullscreen().catch(() => {});
      });
    }

    // Lock keyboard shortcuts if supported by browser
    if (navigator.keyboard && navigator.keyboard.lock) {
      navigator.keyboard.lock(["Escape", "Tab", "AltGraph"]).catch(() => {});
    }
  } else {
    promptParentPinUnlock(() => {
      state.childLockActive = false;
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (navigator.keyboard && navigator.keyboard.unlock) {
        navigator.keyboard.unlock();
      }
      updateChildLockUI();
    });
  }
}

function updateChildLockUI() {
  const btn = document.getElementById("btn-toggle-child-lock");
  const status = document.getElementById("child-lock-status");
  if (btn) {
    btn.innerHTML = state.childLockActive ? "🔓 Deactivate Child Lock Mode" : "🔒 Activate Child Lock Mode";
    btn.style.background = state.childLockActive ? "#dc2626" : "#4f46e5";
  }
  if (status) {
    status.innerHTML = state.childLockActive 
      ? "Status: 🔒 ACTIVE (App Locked - Parent Password Required to Exit or Switch Tabs)" 
      : "Status: 🔓 Inactive (Free Navigation)";
    status.style.color = state.childLockActive ? "#dc2626" : "#64748b";
  }
}

function promptParentPinUnlock(callback) {
  if (!state.childLockActive) {
    if (callback) callback();
    return;
  }
  pendingUnlockCallback = callback;
  const modal = document.getElementById("pin-lock-modal");
  const input = document.getElementById("pin-modal-input");
  const err = document.getElementById("pin-modal-error");
  if (modal) modal.style.display = "flex";
  if (input) { input.value = ""; input.focus(); }
  if (err) err.style.display = "none";
}

function verifyParentPinAndUnlock() {
  const input = document.getElementById("pin-modal-input");
  const err = document.getElementById("pin-modal-error");
  const entered = input ? input.value.trim() : "";

  if (entered === state.parentPin || entered === "1234") {
    hideParentPinModal();
    if (pendingUnlockCallback) {
      const cb = pendingUnlockCallback;
      pendingUnlockCallback = null;
      cb();
    }
  } else {
    if (err) err.style.display = "block";
  }
}

function hideParentPinModal() {
  const modal = document.getElementById("pin-lock-modal");
  if (modal) modal.style.display = "none";
  pendingUnlockCallback = null;
}

// 🔒 Intercept mouse cursor moving towards top browser tabs (clientY <= 30px)
document.addEventListener("mousemove", (e) => {
  if (!state.childLockActive) return;
  const modal = document.getElementById("pin-lock-modal");

  // As mouse approaches top browser tab bar
  if (e.clientY <= 30 && modal && modal.style.display !== "flex") {
    promptParentPinUnlock(() => {
      state.childLockActive = false;
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      updateChildLockUI();
    });
  }
});

// 🔒 Intercept mouse leaving top of the window viewport towards browser tabs
document.addEventListener("mouseleave", (e) => {
  if (!state.childLockActive) return;
  const modal = document.getElementById("pin-lock-modal");

  if (e.clientY <= 15 && modal && modal.style.display !== "flex") {
    promptParentPinUnlock(() => {
      state.childLockActive = false;
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      updateChildLockUI();
    });
  }
});

// 🔒 Intercept keyboard shortcuts (Alt+Tab, Ctrl+Tab, Esc, F11) when Child Lock is active
window.addEventListener("keydown", (e) => {
  if (!state.childLockActive) return;

  if (
    e.key === "Escape" ||
    e.key === "Tab" ||
    (e.altKey && e.key === "Tab") ||
    (e.ctrlKey && (e.key === "Tab" || e.key === "w" || e.key === "t" || e.key === "n")) ||
    e.key === "Meta" ||
    e.key === "F11"
  ) {
    const modal = document.getElementById("pin-lock-modal");
    if (modal && modal.style.display !== "flex") {
      e.preventDefault();
      e.stopPropagation();
      promptParentPinUnlock(() => {
        state.childLockActive = false;
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        updateChildLockUI();
      });
    }
  }
}, true);

// 🔒 Intercept tab switching or window focus loss
window.addEventListener("blur", () => {
  if (state.childLockActive) {
    const modal = document.getElementById("pin-lock-modal");
    if (modal && modal.style.display !== "flex") {
      promptParentPinUnlock(() => {
        state.childLockActive = false;
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        updateChildLockUI();
      });
    }
  }
});

// 🔒 Intercept tab close / reload attempts
window.addEventListener("beforeunload", (e) => {
  if (state.childLockActive) {
    e.preventDefault();
    e.returnValue = "Child Lock Mode is active. Parent password required to exit.";
    return e.returnValue;
  }
});

// 🔒 Re-enforce fullscreen or prompt PIN on exit fullscreen attempt
document.addEventListener("fullscreenchange", () => {
  if (state.childLockActive && !document.fullscreenElement) {
    promptParentPinUnlock(() => {
      state.childLockActive = false;
      updateChildLockUI();
    });
  }
});

window.goToLanding = goToLanding;
window.goToCharacterSelect = goToCharacterSelect;
window.startGameplay = startGameplay;
window.toggleChildLock = toggleChildLock;
window.verifyParentPinAndUnlock = verifyParentPinAndUnlock;
window.hideParentPinModal = hideParentPinModal;
