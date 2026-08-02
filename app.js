// app.js - Kid-Friendly Social Skills Practice Application Orchestrator

// Global Application State
let state = {
  gameState: "HOME", // HOME, LOADING, PLAYING, EVALUATING, RESULTS
  currentModuleId: null,
  currentScenario: null,
  
  // Audio & Speech API
  recognition: null,
  isRecording: false,
  transcriptText: "",
  
  // Character states
  characterEmotion: "neutral",
  characterIsTalking: false,
  
  // Mascot states
  mascotEmotion: "neutral",
  mascotIsTalking: false,
  showMascotBubble: false,
  mascotText: "",
  
  // Pipeline State
  pipelineResult: null,
  
  // TTS settings
  voice: null,
  isMuted: false,

  // Attention System
  childName: "Friend",          // Default; set by user in settings
  attentionAlertActive: false
};

// Elements cache
let el = {};

function initElements() {
  el.homeScreen = document.getElementById("home-screen");
  el.loadingScreen = document.getElementById("loading-screen");
  el.practiceScreen = document.getElementById("practice-screen");
  el.resultsOverlay = document.getElementById("results-overlay");
  
  el.loadingText = document.getElementById("loading-text");
  
  el.characterContainer = document.getElementById("character-container");
  el.mascotContainer = document.getElementById("mascot-container");
  el.dialogueBubbleText = document.getElementById("dialogue-bubble-text");
  el.dialogueSpeakerName = document.getElementById("dialogue-speaker-name");
  el.mascotBubble = document.getElementById("mascot-bubble");
  el.mascotBubbleText = document.getElementById("mascot-bubble-text");
  
  el.micBtn = document.getElementById("mic-btn");
  el.micStatus = document.getElementById("mic-status");
  el.waveform = document.getElementById("waveform");
  el.textInput = document.getElementById("text-input");
  el.submitBtn = document.getElementById("submit-btn");
  el.skipScenarioBtn = document.getElementById("skip-scenario-btn");
  el.backToHomeBtn = document.getElementById("back-to-home-btn");
  
  el.stageTitle = document.getElementById("stage-title");
  el.stageSubtitle = document.getElementById("stage-subtitle");
  
  // Results Overlay Elements
  el.starRating = document.getElementById("star-rating");
  el.evalPoliteness = document.getElementById("eval-politeness");
  el.evalSafety = document.getElementById("eval-safety");
  el.evalRelevance = document.getElementById("eval-relevance");
  el.evalFeedback = document.getElementById("eval-feedback");
  el.nextScenarioBtn = document.getElementById("next-scenario-btn");
  el.retryScenarioBtn = document.getElementById("retry-scenario-btn");
  
  // Settings Elements
  el.settingsBtn = document.getElementById("settings-btn");
  el.settingsModal = document.getElementById("settings-modal");
  el.closeSettingsBtn = document.getElementById("close-settings-btn");
  el.voiceSelect = document.getElementById("voice-select");
  el.muteToggle = document.getElementById("mute-toggle");

  // Attention Overlay Elements
  el.attentionOverlay     = document.getElementById("attention-overlay");
  el.attentionMascot      = document.getElementById("attention-mascot");
  el.attentionNameDisplay = document.getElementById("attention-name-display");
  el.attentionPromptText  = document.getElementById("attention-prompt-text");
  el.childNameInput       = document.getElementById("child-name-input");
}

// ==========================================
// Browser Web Speech API Integration
// ==========================================

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech Recognition API not supported in this browser.");
    if (el.micStatus) el.micStatus.innerText = "Mic unsupported. Tap any picture card below! 🎨";
    return;
  }
  
  try {
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = false;
    state.recognition.interimResults = false;
    state.recognition.lang = "en-US";
    
    state.recognition.onstart = () => {
      state.isRecording = true;
      el.micBtn.classList.add("recording");
      el.waveform.style.display = "flex";
      el.micStatus.innerText = "Listening... Speak to Buddy! 🎤";
    };
    
    state.recognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      if (resultText && resultText.trim().length > 0) {
        el.textInput.value = resultText;
        state.transcriptText = resultText;
        if (el.micStatus) {
          el.micStatus.innerText = `You said: "${resultText}" 🗣️ Sending to Buddy...`;
        }
        stopRecording();
        submitAnswer(resultText);
      }
    };
    
    state.recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        el.micStatus.innerText = "Microphone blocked in browser. Tap any cartoon card below! 🎨";
      } else {
        el.micStatus.innerText = "Didn't hear you clearly. Tap a picture card below! 🎨";
      }
      stopRecording();
    };
    
    state.recognition.onend = () => {
      stopRecording();
    };
  } catch (e) {
    console.error("Speech Recognition init error:", e);
    if (el.micStatus) el.micStatus.innerText = "Tap any picture card below to respond! 🎨";
  }
}

function startRecording() {
  if (!state.recognition) {
    initSpeechRecognition();
  }
  
  if (state.recognition) {
    if (state.isRecording) {
      stopRecording();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      state.characterIsTalking = false;
      state.mascotIsTalking = false;
      renderCharacters();
      
      state.recognition.start();
    } catch (err) {
      console.warn("Speech start warning:", err);
      try {
        state.recognition.stop();
        setTimeout(() => state.recognition.start(), 250);
      } catch (e) {
        if (el.micStatus) el.micStatus.innerText = "Mic busy. Tap any cartoon card below! 🎨";
      }
    }
  } else {
    if (el.micStatus) el.micStatus.innerText = "Mic unavailable. Tap any cartoon card below! 🎨";
  }
}

function stopRecording() {
  if (state.isRecording) {
    state.isRecording = false;
    if (el.micBtn) el.micBtn.classList.remove("recording");
    if (el.waveform) el.waveform.style.display = "none";
    if (state.recognition) {
      try { state.recognition.stop(); } catch (e) {}
    }
  }
}

// Text-to-Speech (TTS)
// options: { rate, pitch } — defaults tuned for a calm, warm delivery
function speakText(text, onStart, onEnd, options = {}) {
  if (state.isMuted) {
    if (onStart) onStart();
    setTimeout(() => { if (onEnd) onEnd(); }, 1500);
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  if (state.voice) utterance.voice = state.voice;

  // Calm, unhurried delivery — slightly slower and warmer than browser default
  utterance.rate  = options.rate  ?? 0.87;   // 1.0 = normal; 0.87 feels gentle
  utterance.pitch = options.pitch ?? 1.05;   // Slightly raised = warmer/friendlier
  utterance.volume = 0.95;

  utterance.onstart = () => { if (onStart) onStart(); };
  utterance.onend   = () => { if (onEnd)   onEnd();   };
  utterance.onerror = (e) => {
    console.error("Speech Synthesis Error:", e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

// Load and populate speech synthesis voices
// Priority: warm/natural-sounding voices over robotic ones
const SOFT_VOICE_PRIORITY = [
  // Warm, calm, child-friendly voices (ordered by preference)
  "Samantha",   // macOS/iOS — very natural
  "Karen",      // macOS/iOS Australian — soft
  "Moira",      // macOS/iOS Irish — gentle
  "Tessa",      // macOS/iOS South African
  "Fiona",      // macOS/iOS Scottish — soft
  "Google UK English Female",
  "Microsoft Libby",
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Zira",
  "Google US English",
];

function populateVoices() {
  if (!window.speechSynthesis) return;

  const voices = window.speechSynthesis.getVoices();
  el.voiceSelect.innerHTML = "";

  // Find the best soft voice automatically
  if (!state.voice) {
    for (const preferred of SOFT_VOICE_PRIORITY) {
      const match = voices.find(v => v.name.includes(preferred) && v.lang.startsWith("en"));
      if (match) { state.voice = match; break; }
    }
    // Fallback: any en-GB or en-AU (tend to be softer than en-US)
    if (!state.voice) {
      state.voice = voices.find(v => v.lang === "en-GB" || v.lang === "en-AU")
                 ?? voices.find(v => v.lang.startsWith("en-"))
                 ?? voices[0];
    }
  }

  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    if (state.voice && voice.name === state.voice.name) option.selected = true;
    el.voiceSelect.appendChild(option);
  });
}

// ==========================================
// Navigation & State Machine Transitions
// ==========================================

function renderVisualHints(currentMod) {
  const hintsGrid = document.getElementById("visual-hints-grid");
  if (!hintsGrid || !currentMod || !currentMod.visualHints) return;

  const existingNextBar = document.getElementById("next-action-bar");
  if (existingNextBar) existingNextBar.remove();

  hintsGrid.innerHTML = "";
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
      
      el.textInput.value = hint.fullText;
      if (el.micStatus) {
        el.micStatus.innerText = `Hint Idea: "${hint.label}". Speak your answer now! 🎙️`;
      }

      speakText(`Hint: You can say, ${hint.fullText}`, null, () => {
        requestMicPermissionAndStart();
      });
    };

    hintsGrid.appendChild(card);
  });
}

function transitionTo(newState) {
  state.gameState = newState;
  
  // Hide all screens initially
  el.homeScreen.style.display = "none";
  el.loadingScreen.style.display = "none";
  el.practiceScreen.style.display = "none";
  el.resultsOverlay.style.display = "none";
  
  switch (newState) {
    case "HOME":
      window.speechSynthesis.cancel();
      el.homeScreen.style.display = "flex";
      el.stageTitle.innerText = "SocialBuddy";
      el.stageSubtitle.innerText = "Practice speaking with different friends!";
      state.currentModuleId = null;
      state.currentScenario = null;
      if (window.AttentionSystem) window.AttentionSystem.stop();
      hideAttentionAlert();
      break;
      
    case "LOADING":
      el.loadingScreen.style.display = "flex";
      const mod = scenarios[state.currentModuleId];
      el.loadingText.innerText = `Walking to the ${mod.sceneName}...`;
      
      setTimeout(() => {
        transitionTo("PLAYING");
      }, 1200);
      break;
      
    case "PLAYING":
      el.practiceScreen.style.display = "grid";
      const currentMod = scenarios[state.currentModuleId];
      state.currentScenario = currentMod;
      
      el.stageTitle.innerText = `${currentMod.name} Scenario`;
      el.stageSubtitle.innerText = currentMod.introText;
      
      el.practiceScreen.querySelector(".stage").className = `stage ${currentMod.bgClass}`;
      el.dialogueSpeakerName.innerText = currentMod.characterName;
      el.dialogueBubbleText.innerText = "Hello!";
      
      renderVisualHints(currentMod);

      el.mascotBubble.style.display = "none";
      state.showMascotBubble = false;
      
      el.textInput.value = "";
      state.transcriptText = "";
      el.micStatus.innerText = "Tap the Big Mic to Speak! 🎙️";
      updateSendButtonVisibility();
      
      state.characterEmotion = currentMod.initialEmotion;
      state.mascotEmotion = "neutral";
      
      renderCharacters();
      
      setTimeout(() => {
        speakPrompt();
      }, 400);

      if (window.AttentionSystem) {
        window.AttentionSystem.reset();
        window.AttentionSystem.start(
          showAttentionAlert,
          hideAttentionAlert
        );
      }
      break;
  }
}

function speakPrompt() {
  el.dialogueBubbleText.innerText = state.currentScenario.question;
  speakText(
    state.currentScenario.audioPrompt,
    () => {
      state.characterIsTalking = true;
      renderCharacters();
    },
    () => {
      state.characterIsTalking = false;
      renderCharacters();
    }
  );
}

// ==========================================
// Direct Kid-Friendly Response Processor
// ==========================================

async function submitAnswer(textVal) {
  if (!textVal || !textVal.trim()) return;

  stopRecording();

  try {
    if (el.submitBtn) el.submitBtn.disabled = true;
    if (el.micBtn) el.micBtn.style.pointerEvents = "none";
    
    el.dialogueBubbleText.innerText = `You said: "${textVal}" 🗣️`;
    
    // Calculate results using Python FastAPI Ontology Backend
    state.pipelineResult = await window.runFullPipelineAsync(state.currentModuleId, textVal);
    const res = state.pipelineResult;
    
    // Show Mascot Guidance Bubble directly on stage
    state.showMascotBubble = true;
    el.mascotBubble.style.display = "block";
    el.mascotBubbleText.innerText = res.llm.mascotFeedback;
    
    state.characterEmotion = res.llm.characterEmotion || "happy";
    state.mascotEmotion = res.llm.scores.safety <= 3 ? "concerned" : "happy";
    renderCharacters();
    
    // Speak Mascot Feedback out loud automatically!
    speakText(res.llm.mascotFeedback, () => {
      state.mascotIsTalking = true;
      renderCharacters();
    }, () => {
      state.mascotIsTalking = false;
      renderCharacters();
    });
    
    // Show Next Friend Action Controls
    renderNextActionBar();
  } catch (err) {
    console.error("submitAnswer error:", err);
  } finally {
    if (el.submitBtn) el.submitBtn.disabled = false;
    if (el.micBtn) el.micBtn.style.pointerEvents = "auto";
  }
}

function renderNextActionBar() {
  const hintsCard = document.querySelector(".visual-hints-card");
  if (!hintsCard) return;
  
  let nextBar = document.getElementById("next-action-bar");
  if (!nextBar) {
    nextBar = document.createElement("div");
    nextBar.id = "next-action-bar";
    nextBar.className = "next-action-bar";
    hintsCard.appendChild(nextBar);
  }
  
  const moduleKeys = Object.keys(scenarios);
  const currentIndex = moduleKeys.indexOf(state.currentModuleId);
  const nextModuleId = moduleKeys[(currentIndex + 1) % moduleKeys.length];
  const nextMod = scenarios[nextModuleId];

  nextBar.innerHTML = `
    <button class="btn btn-primary btn-bounce" id="next-friend-btn" style="font-size:1.15rem; padding:0.85rem 1.75rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
      Next Friend: ${nextMod.name} ➡️
    </button>
    <button class="btn btn-outline" id="retry-current-btn" style="font-size:1rem;">
      Try Again 🔄
    </button>
  `;

  document.getElementById("next-friend-btn").onclick = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    state.currentModuleId = nextModuleId;
    nextBar.remove();
    transitionTo("PLAYING");
  };

  document.getElementById("retry-current-btn").onclick = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    nextBar.remove();
    transitionTo("PLAYING");
  };
}

function triggerMascotFeedback() {
  state.showMascotBubble = true;
  state.mascotText = state.pipelineResult.llm.mascotFeedback;
  
  // Set Mascot emotion based on score safety
  if (state.pipelineResult.llm.scores.safety <= 3) {
    state.mascotEmotion = "concerned";
  } else {
    state.mascotEmotion = "happy";
  }
  
  // Character updates emotion based on safety evaluation
  state.characterEmotion = state.pipelineResult.llm.characterEmotion;
  
  // Display mascot bubble
  el.mascotBubbleText.innerText = state.mascotText;
  el.mascotBubble.style.display = "block";
  
  // Render character emotions
  renderCharacters();
  
  // Speak mascot feedback
  speakText(
    state.mascotText,
    () => {
      state.mascotIsTalking = true;
      renderCharacters();
    },
    () => {
      state.mascotIsTalking = false;
      renderCharacters();
      
      // Show celebration results overlay
      setTimeout(() => {
        transitionTo("RESULTS");
      }, 1500);
    }
  );
}

// ==========================================
// Attention Re-engagement
// ==========================================

function showAttentionAlert() {
  if (state.attentionAlertActive) return;
  state.attentionAlertActive = true;

  // Stop TTS so it doesn't overlap
  window.speechSynthesis.cancel();

  // Render waving Buddy into the overlay
  el.attentionMascot.innerHTML = getCharacterSVG("mascot-waving", "happy", false);

  // Set personalised name greeting
  el.attentionNameDisplay.innerText = `Hey, ${state.childName}! 👋`;
  el.attentionPromptText.innerText = `It's okay! Take your time. Buddy is right here waiting for you!`;

  el.attentionOverlay.style.display = "flex";

  // Gentle TTS nudge — extra slow & warm so it doesn't startle the child
  speakText(
    `Hey ${state.childName}... come back. Buddy is right here waiting for you.`,
    null,
    null,
    { rate: 0.78, pitch: 1.12 }   // noticeably slower & warmer than normal speech
  );
}

function hideAttentionAlert() {
  if (!state.attentionAlertActive) return;
  state.attentionAlertActive = false;

  el.attentionOverlay.style.display = "none";

  // Resume scenario prompt if we're mid-play
  if (state.gameState === "PLAYING" && state.currentScenario) {
    setTimeout(() => {
      speakText(
        `Welcome back, ${state.childName}! Let's continue.`,
        null,
        () => speakPrompt()
      );
    }, 400);
  }
}

// ==========================================
// Rendering Methods
// ==========================================

function renderCharacters() {
  if (state.currentScenario) {
    el.characterContainer.innerHTML = getCharacterSVG(
      state.currentScenario.id, 
      state.characterEmotion, 
      state.characterIsTalking
    );
  } else {
    el.characterContainer.innerHTML = "";
  }
  
  el.mascotContainer.innerHTML = getCharacterSVG(
    "mascot", 
    state.mascotEmotion, 
    state.mascotIsTalking
  );
}

function renderResultsOverlay() {
  el.resultsOverlay.style.display = "flex";
  
  const scores = state.pipelineResult.llm.scores;
  el.evalPoliteness.innerText = `${scores.politeness}/10`;
  el.evalSafety.innerText = `${scores.safety}/10`;
  el.evalRelevance.innerText = `${scores.relevance}/10`;
  el.evalFeedback.innerText = state.pipelineResult.llm.mascotFeedback;
  
  // Render Star Ratings
  el.starRating.innerHTML = "";
  const totalStars = 5;
  const earnedStars = scores.overall;
  
  for (let i = 1; i <= totalStars; i++) {
    const star = document.createElement("span");
    star.className = `star ${i <= earnedStars ? "active-star" : ""}`;
    star.innerText = "★";
    
    // Add staggered slide-in animations for stars
    star.style.animation = `fade-in 0.3s ease forwards`;
    star.style.animationDelay = `${i * 0.12}s`;
    
    el.starRating.appendChild(star);
  }
  
  // Clean up input fields for retry
  el.submitBtn.disabled = false;
  el.micBtn.style.pointerEvents = "auto";
  el.textInput.disabled = false;
}

function updateSendButtonVisibility() {
  if (!el.submitBtn || !el.textInput) return;
  const hasTypedText = el.textInput.value.trim().length > 0;
  el.submitBtn.style.display = hasTypedText ? "inline-flex" : "none";
}

async function requestMicPermissionAndStart() {
  if (state.isRecording) {
    stopRecording();
    return;
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.audioStream = stream;
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      if (el.micStatus) el.micStatus.innerText = "Mic blocked! Please click 'Allow' in your URL bar 🎙️";
      return;
    }
  }

  startRecording();
}

// ==========================================
// Event Listeners & Initializations
// ==========================================

function bindEvents() {
  // Module selection
  document.querySelectorAll(".module-card").forEach(card => {
    card.addEventListener("click", () => {
      // Unlock browser SpeechSynthesis on user click gesture
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      state.currentModuleId = card.getAttribute("data-module");
      transitionTo("LOADING");
    });
  });
  
  // Voice Input Events with explicit permission prompt
  el.micBtn.addEventListener("click", () => {
    requestMicPermissionAndStart();
  });

  // Replay Audio Speaker Button
  const repeatBtn = document.getElementById("repeat-audio-btn");
  if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      speakPrompt();
    });
  }
  
  // Send Button visibility (only displays when typed text exists)
  el.textInput.addEventListener("input", updateSendButtonVisibility);
  el.textInput.addEventListener("keyup", updateSendButtonVisibility);

  // TextInput submission
  el.submitBtn.addEventListener("click", () => {
    submitAnswer(el.textInput.value);
    updateSendButtonVisibility();
  });
  
  // Enter key to submit
  el.textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitAnswer(el.textInput.value);
      updateSendButtonVisibility();
    }
  });
  
  // Scene controls
  el.skipScenarioBtn.addEventListener("click", () => {
    transitionTo("HOME");
  });
  
  el.backToHomeBtn.addEventListener("click", () => {
    transitionTo("HOME");
  });
  
  el.nextScenarioBtn.addEventListener("click", () => {
    transitionTo("HOME");
  });
  
  el.retryScenarioBtn.addEventListener("click", () => {
    transitionTo("PLAYING");
  });
  
  // Settings Modal controls
  el.settingsBtn.addEventListener("click", () => {
    populateVoices();
    el.settingsModal.style.display = "flex";
  });
  
  el.closeSettingsBtn.addEventListener("click", () => {
    el.settingsModal.style.display = "none";
  });
  
  window.addEventListener("click", (e) => {
    if (e.target === el.settingsModal) {
      el.settingsModal.style.display = "none";
    }
  });
  
  el.voiceSelect.addEventListener("change", () => {
    const voices = window.speechSynthesis.getVoices();
    state.voice = voices[parseInt(el.voiceSelect.value)];
  });
  
  el.muteToggle.addEventListener("change", (e) => {
    state.isMuted = e.target.checked;
    if (state.isMuted) {
      window.speechSynthesis.cancel();
    }
  });

  // Child name input — personalises attention alert greeting
  el.childNameInput.addEventListener("input", (e) => {
    const name = e.target.value.trim();
    state.childName = name.length > 0 ? name : "Friend";
  });
}

// Window load entry
window.addEventListener("DOMContentLoaded", async () => {
  initElements();
  bindEvents();
  initSpeechRecognition();
  
  // Load voices for Speech Synthesis
  if (window.speechSynthesis) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    populateVoices();
  }

  // Initialise attention detection (async, non-blocking)
  if (window.AttentionSystem) {
    await window.AttentionSystem.init();
  }
  
  // Start on Home screen
  transitionTo("HOME");
});
