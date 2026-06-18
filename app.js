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
  isMuted: false
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
}

// ==========================================
// Browser Web Speech API Integration
// ==========================================

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech Recognition API not supported in this browser. Falling back to typing.");
    if (el.micStatus) el.micStatus.innerText = "Mic unsupported (Type below)";
    return;
  }
  
  state.recognition = new SpeechRecognition();
  state.recognition.continuous = false;
  state.recognition.interimResults = false;
  state.recognition.lang = "en-US";
  
  state.recognition.onstart = () => {
    state.isRecording = true;
    el.micBtn.classList.add("recording");
    el.waveform.style.display = "flex";
    el.micStatus.innerText = "Listening... Speak now!";
  };
  
  state.recognition.onresult = (event) => {
    const resultText = event.results[0][0].transcript;
    el.textInput.value = resultText;
    state.transcriptText = resultText;
    el.micStatus.innerText = "Speech captured! Click Send to see what Buddy thinks.";
  };
  
  state.recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    el.micStatus.innerText = `Microphone error: ${event.error}. Please type.`;
    stopRecording();
  };
  
  state.recognition.onend = () => {
    stopRecording();
  };
}

function startRecording() {
  if (state.recognition && !state.isRecording) {
    try {
      // Stop TTS if speaking
      window.speechSynthesis.cancel();
      state.characterIsTalking = false;
      state.mascotIsTalking = false;
      renderCharacters();
      
      state.recognition.start();
    } catch (err) {
      console.error(err);
    }
  }
}

function stopRecording() {
  if (state.isRecording) {
    state.isRecording = false;
    if (el.micBtn) el.micBtn.classList.remove("recording");
    if (el.waveform) el.waveform.style.display = "none";
    if (state.recognition) {
      state.recognition.stop();
    }
  }
}

// Text-to-Speech (TTS)
function speakText(text, onStart, onEnd) {
  if (state.isMuted) {
    if (onStart) onStart();
    setTimeout(() => {
      if (onEnd) onEnd();
    }, 1500); // Simulated delay
    return;
  }

  // Cancel any active speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  if (state.voice) {
    utterance.voice = state.voice;
  }
  
  utterance.onstart = () => {
    if (onStart) onStart();
  };
  
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  
  utterance.onerror = (e) => {
    console.error("Speech Synthesis Error:", e);
    if (onEnd) onEnd();
  };
  
  window.speechSynthesis.speak(utterance);
}

// Load and populate speech synthesis voices
function populateVoices() {
  if (!window.speechSynthesis) return;
  
  const voices = window.speechSynthesis.getVoices();
  el.voiceSelect.innerHTML = "";
  
  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    
    // Choose sensible default voice
    if (voice.lang.startsWith("en-") && !state.voice) {
      if (voice.name.includes("Google") || voice.name.includes("Natural") || voice.name.includes("Zira")) {
        state.voice = voice;
        option.selected = true;
      }
    }
    el.voiceSelect.appendChild(option);
  });
  
  if (!state.voice && voices.length > 0) {
    state.voice = voices[0];
  }
}

// ==========================================
// Navigation & State Machine Transitions
// ==========================================

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
      break;
      
    case "LOADING":
      el.loadingScreen.style.display = "flex";
      const mod = scenarios[state.currentModuleId];
      el.loadingText.innerText = `Walking to the ${mod.sceneName}...`;
      
      // Delay to simulate scene load transition
      setTimeout(() => {
        transitionTo("PLAYING");
      }, 1500);
      break;
      
    case "PLAYING":
      el.practiceScreen.style.display = "grid";
      const currentMod = scenarios[state.currentModuleId];
      state.currentScenario = currentMod;
      
      el.stageTitle.innerText = `${currentMod.name} Scenario`;
      el.stageSubtitle.innerText = currentMod.introText;
      
      // Setup backdrop class
      el.practiceScreen.querySelector(".stage").className = `stage ${currentMod.bgClass}`;
      el.dialogueSpeakerName.innerText = currentMod.characterName;
      el.dialogueBubbleText.innerText = "Hello!";
      
      // Hide mascot guidance bubble initially
      el.mascotBubble.style.display = "none";
      state.showMascotBubble = false;
      
      // Reset inputs
      el.textInput.value = "";
      state.transcriptText = "";
      el.micStatus.innerText = "Press the mic to speak, or type below";
      
      state.characterEmotion = currentMod.initialEmotion;
      state.mascotEmotion = "neutral";
      
      renderCharacters();
      
      // Speak the prompt after a slight delay
      setTimeout(() => {
        speakPrompt();
      }, 400);
      break;
      
    case "EVALUATING":
      el.practiceScreen.style.display = "grid";
      
      // Lock inputs during thinking state
      el.submitBtn.disabled = true;
      el.micBtn.style.pointerEvents = "none";
      el.textInput.disabled = true;
      
      runPipelineSequence();
      break;
      
    case "RESULTS":
      el.practiceScreen.style.display = "grid";
      renderResultsOverlay();
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
// Kid-Friendly Pipeline Sequence
// ==========================================

function runPipelineSequence() {
  const textVal = el.textInput.value.trim();
  if (!textVal) {
    alert("Please type something or speak to Buddy first!");
    transitionTo("PLAYING");
    el.submitBtn.disabled = false;
    el.micBtn.style.pointerEvents = "auto";
    el.textInput.disabled = false;
    return;
  }
  
  // Calculate results instantly behind the scenes using our mock engine
  state.pipelineResult = runFullPipeline(state.currentModuleId, textVal);
  
  // Show a cute thinking dialogue bubble
  el.dialogueBubbleText.innerText = "Buddy the Mascot is thinking... 💭";
  state.mascotEmotion = "neutral";
  state.characterEmotion = "neutral";
  renderCharacters();
  
  // Wait 1.5 seconds, then display Mascot's guidance
  setTimeout(() => {
    triggerMascotFeedback();
  }, 1500);
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

// ==========================================
// Event Listeners & Initializations
// ==========================================

function bindEvents() {
  // Module selection
  document.querySelectorAll(".module-card").forEach(card => {
    card.addEventListener("click", () => {
      state.currentModuleId = card.getAttribute("data-module");
      transitionTo("LOADING");
    });
  });
  
  // Voice Input Events
  el.micBtn.addEventListener("click", () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
  
  // TextInput submission
  el.submitBtn.addEventListener("click", () => {
    stopRecording();
    transitionTo("EVALUATING");
  });
  
  // Enter key to submit
  el.textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      stopRecording();
      transitionTo("EVALUATING");
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
}

// Window load entry
window.addEventListener("DOMContentLoaded", () => {
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
  
  // Start on Home screen
  transitionTo("HOME");
});
