// ============================================================
// FRONTEND LOGIC - Social Skills Assistant
// ============================================================

const app = {
    state: {
        currentCharacter: null,
        questions: [],
        currentIndex: 0,
        totalStars: 0,
        isListening: false,
        recognition: null,
        currentAudio: null
    },

    // --------------------------------------------------------
    // INIT
    // --------------------------------------------------------
    init() {
        this.initSpeechRecognition();
        this.fetchCharacters();
    },

    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Speech recognition not available in this browser. Use text input below.");
            const speakText = document.getElementById('speak-btn-text');
            if (speakText) speakText.innerText = "Mic Unavailable (Use Text Below)";
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.state.recognition = new SpeechRecognition();
        this.state.recognition.continuous = false;
        this.state.recognition.interimResults = false;
        
        // We set to Tamil (India) so it can pick up Tamil speech accurately
        // The backend will normalize it
        this.state.recognition.lang = 'ta-IN';

        this.state.recognition.onstart = () => {
            this.state.isListening = true;
            document.getElementById('btn-speak').classList.add('listening');
            document.getElementById('speak-btn-text').innerText = "Stop Speaking";
            document.getElementById('listening-indicator').classList.remove('hidden');
        };

        this.state.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.stopListening();
            this.submitResponse(transcript);
        };

        this.state.recognition.onerror = (event) => {
            console.error(event.error);
            this.stopListening();
            if (event.error !== 'no-speech') {
                alert("Microphone error: " + event.error);
            }
        };

        this.state.recognition.onend = () => {
            if (this.state.isListening) {
                this.stopListening();
            }
        };
    },

    submitTextInput() {
        const inputEl = document.getElementById('text-response-input');
        if (!inputEl) return;
        const text = inputEl.value.trim();
        if (!text) {
            alert("Please type your response before sending!");
            return;
        }
        inputEl.value = '';
        this.submitResponse(text);
    },

    handleKeyPress(event) {
        if (event.key === 'Enter') {
            this.submitTextInput();
        }
    },

    // --------------------------------------------------------
    // API CALLS
    // --------------------------------------------------------
    async fetchCharacters() {
        try {
            const res = await fetch('/api/characters');
            const data = await res.json();
            this.renderCharacters(data.characters);
        } catch (e) {
            console.error("Error fetching characters:", e);
        }
    },

    async selectCharacter(charName) {
        try {
            const res = await fetch(`/api/questions/${charName}`);
            const data = await res.json();
            
            this.state.currentCharacter = charName;
            this.state.questions = data.questions;
            this.state.currentIndex = 0;
            
            this.showScreen('question-screen');
            this.loadQuestion();
        } catch (e) {
            console.error("Error fetching questions:", e);
        }
    },

    async submitResponse(text) {
        document.getElementById('processing-indicator').classList.remove('hidden');
        document.getElementById('btn-speak').disabled = true;

        const currentQ = this.state.questions[this.state.currentIndex];

        try {
            const res = await fetch('/api/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question_id: currentQ.id,
                    response: text
                })
            });
            const data = await res.json();
            
            document.getElementById('processing-indicator').classList.add('hidden');
            document.getElementById('btn-speak').disabled = false;
            
            this.showFeedback(data);
        } catch (e) {
            console.error("Error evaluating:", e);
            document.getElementById('processing-indicator').classList.add('hidden');
            document.getElementById('btn-speak').disabled = false;
        }
    },

    // --------------------------------------------------------
    // UI RENDERING
    // --------------------------------------------------------
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        // Stop audio if playing
        if (this.state.currentAudio) {
            this.state.currentAudio.pause();
            this.state.currentAudio.currentTime = 0;
            document.getElementById('btn-play-audio').classList.remove('playing');
        }
    },

    renderCharacters(characters) {
        const grid = document.getElementById('character-grid');
        grid.innerHTML = '';

        characters.forEach(c => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.onclick = () => this.selectCharacter(c.name);
            
            card.innerHTML = `
                <div class="char-avatar">${c.avatar}</div>
                <h2 class="char-name">${c.name}</h2>
                <p class="char-desc">${c.description}</p>
                <p class="char-desc" style="margin-top: 10px; font-size: 14px;">${c.total_questions} Questions</p>
            `;
            grid.appendChild(card);
        });
    },

    loadQuestion() {
        const q = this.state.questions[this.state.currentIndex];
        
        // Update header
        document.getElementById('progress-text').innerText = `Question ${this.state.currentIndex + 1} of ${this.state.questions.length}`;
        const pct = ((this.state.currentIndex) / this.state.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${pct}%`;
        
        // Update story
        document.getElementById('social-story-text').innerText = q.social_story;
        
        // Update char
        document.getElementById('q-avatar').innerText = q.avatar;
        document.getElementById('q-character-name').innerText = q.character;
        
        // Update Q
        document.getElementById('q-tanglish').innerText = q.question_tanglish;
        document.getElementById('q-tamil').innerText = q.question_tamil;
    },

    showFeedback(data) {
        this.showScreen('feedback-screen');
        
        // Add to total stars
        this.state.totalStars += data.stars;
        document.getElementById('total-stars').innerText = this.state.totalStars;

        // Render stars visually
        const starsDisplay = document.getElementById('f-stars-display');
        starsDisplay.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < data.stars) {
                starsDisplay.innerHTML += '⭐';
            } else {
                starsDisplay.innerHTML += '🌑'; // empty star
            }
        }

        document.getElementById('f-encouragement').innerText = data.encouragement;
        document.getElementById('f-child-said').innerText = `"${data.transcribed_text || '(Nothing)'}"`;
        document.getElementById('f-message').innerText = data.feedback;

        const suggBox = document.getElementById('f-suggestion-box');
        if (data.suggestion) {
            suggBox.classList.remove('hidden');
            document.getElementById('f-suggestion').innerText = data.suggestion;
        } else {
            suggBox.classList.add('hidden');
        }

        // Change next button text if it's the last question
        const isLast = (this.state.currentIndex === this.state.questions.length - 1);
        document.getElementById('btn-next').innerText = isLast ? "🏁 Finish" : "➡️ Next Question";
    },

    // --------------------------------------------------------
    // ACTIONS
    // --------------------------------------------------------
    goHome() {
        this.showScreen('home-screen');
    },

    playAudio() {
        const q = this.state.questions[this.state.currentIndex];
        
        if (this.state.currentAudio) {
            this.state.currentAudio.pause();
            this.state.currentAudio.currentTime = 0;
            document.getElementById('btn-play-audio').classList.remove('playing');
            
            // If tapping the same audio while playing, just stop it
            if (!this.state.currentAudio.ended) {
                this.state.currentAudio = null;
                return;
            }
        }

        const audioUrl = `/api/audio/${q.id}`;
        const audio = new Audio(audioUrl);
        this.state.currentAudio = audio;
        
        document.getElementById('btn-play-audio').classList.add('playing');
        
        audio.onended = () => {
            document.getElementById('btn-play-audio').classList.remove('playing');
        };
        
        audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            document.getElementById('btn-play-audio').classList.remove('playing');
            alert("Could not load audio. Please check server.");
        };

        audio.play();
    },

    toggleListening() {
        if (this.state.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    },

    startListening() {
        // Stop audio if playing
        if (this.state.currentAudio) {
            this.state.currentAudio.pause();
            this.state.currentAudio.currentTime = 0;
            document.getElementById('btn-play-audio').classList.remove('playing');
        }
        
        try {
            this.state.recognition.start();
        } catch (e) {
            console.error(e);
        }
    },

    stopListening() {
        this.state.isListening = false;
        try {
            this.state.recognition.stop();
        } catch (e) { }
        
        document.getElementById('btn-speak').classList.remove('listening');
        document.getElementById('speak-btn-text').innerText = "Tap to Speak";
        document.getElementById('listening-indicator').classList.add('hidden');
    },

    retryQuestion() {
        this.showScreen('question-screen');
    },

    nextQuestion() {
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.state.currentIndex++;
            this.showScreen('question-screen');
            this.loadQuestion();
        } else {
            // Finished
            document.getElementById('c-earned-stars').innerText = this.state.totalStars;
            this.showScreen('completion-screen');
        }
    }
};

// Start app on load
window.onload = () => {
    app.init();
};
