// scenarios.js - Configured practice modules, ontology rules, and RAG reference cases
// Each scenario now includes bilingual (Tamil + Tanglish) question display

const scenarios = {
  teacher: {
    id: "teacher",
    name: "Teacher",
    characterName: "Ms. Apple",
    sceneName: "Classroom",
    themeColor: "--accent-teacher",
    bgClass: "scene-classroom",
    initialEmotion: "neutral",
    introText: "Let's practice talking politely to your teacher in the classroom. Ms. Apple is about to start a spelling test.",
    question: "Welcome back, class! Before we start our spelling test, does anyone need to use the restroom?",
    audioPrompt: "சரி கிளாஸ்! ஸ்பெல்லிங் டெஸ்ட் ஸ்டார்ட் பண்றதுக்கு முன்னாடி, யாரோவது பாத்ரூம் போகணுமா?",

    // Bilingual dialogue display (Tamil script + Tanglish romanisation)
    tanglishQuestion: "Sari class! Spelling test start pannum munnaadi, யாரோவது bathroom poganumaa?",
    tamilQuestion: "சரி கிளாஸ்! ஸ்பெல்லிங் டெஸ்ட் ஸ்டார்ட் பண்றதுக்கு முன்னாடி, யாரோவது பாத்ரூம் போகணுமா?",

    // Ontology of Rules for Teacher Interactions
    ontology: {
      rules: [
        {
          id: "T_POLITE",
          name: "Polite Request Form",
          description: "Use polite words like 'please', 'excuse me', 'may I', 'vaanga', or 'nga'.",
          keywords: ["please", "excuse", "may i", "could you", "thank you", "would you mind", "vaanga", "nga", "neenga", "sir", "ங்க", "நீங்க", "சார்"],
          severity: "high"
        },
        {
          id: "T_PURPOSE",
          name: "Clear Request Purpose",
          description: "Clearly state your need (bathroom, toilet, restroom, toilet poganum).",
          keywords: ["bathroom", "restroom", "toilet", "washroom", "pee", "poop", "go", "toilet poganum", "bathroom poganum", "கழிவறை", "பாத்ரூம்"],
          severity: "high"
        },
        {
          id: "T_DECORUM",
          name: "Respectful Decorum",
          description: "Avoid demanding, aggressive, or overly abrupt statements.",
          negativeKeywords: ["gonna go", "i want", "let me", "have to leave now", "im leaving"],
          severity: "medium"
        }
      ],
      description: "School Decorum & Classroom Behavior Standard. Requires polite requests to authority figures, clear statement of bodily needs, and respectful phrasing."
    },

    ragDatabase: [
      {
        utterance: "Excuse me Ms. Apple, may I please go to the bathroom?",
        intent: "polite_request",
        vector: [0.95, 0.9, 0.99, 0.98],
        evaluation: { score: 10, emotion: "happy", feedback: "Wonderful job! You were very polite, used 'excuse me' and 'please', and clearly stated what you needed." }
      },
      {
        utterance: "Please can I go to the restroom?",
        intent: "standard_polite",
        vector: [0.85, 0.88, 0.92, 0.9],
        evaluation: { score: 9, emotion: "happy", feedback: "Great response! You asked politely using 'please' and made your request clear." }
      },
      {
        utterance: "Ms. Apple, bathroom poganuma? Please vaanga.",
        intent: "tanglish_polite_request",
        vector: [0.92, 0.9, 0.95, 0.93],
        evaluation: { score: 10, emotion: "happy", feedback: "Super! Tamil-la politely ketathu romba nalla irukku! 'Please vaanga' sonna teacher kku romba happy aagum!" }
      },
      {
        utterance: "I need to go to the toilet right now.",
        intent: "abrupt_request",
        vector: [0.75, 0.6, 0.5, 0.7],
        evaluation: { score: 6, emotion: "concerned", feedback: "You stated what you needed clearly, but it sounds a bit demanding. Try adding 'please' or asking 'may I' to make it polite." }
      },
      {
        utterance: "No thank you, I am ready for the test.",
        intent: "polite_refusal",
        vector: [0.9, 0.95, 0.85, 0.9],
        evaluation: { score: 10, emotion: "proud", feedback: "Excellent! You answered the question directly and politely let her know you are ready." }
      }
    ]
  },

  parent: {
    id: "parent",
    name: "Dad (Parent)",
    characterName: "Dad",
    sceneName: "Living Room",
    themeColor: "--accent-parent",
    bgClass: "scene-livingroom",
    initialEmotion: "neutral",
    introText: "Let's practice telling the truth and apologizing when something goes wrong. Dad is in the living room.",
    question: "Oh no! Did you drop this toy? It looks like the robot's arm is broken. Can you tell me what happened?",
    audioPrompt: "ஐயோ! நீ தான் இதை தவறித்தியா? ரோபோட்டோட கையை பாரு, உடைஞ்சிருக்கு! என்ன ஆச்சு னு சொல்லு.",

    tanglishQuestion: "Ayyo! Nee thaan ithai thavarttiya? Robot-oda kaiyai paaru, udainjirukkku! Enna aachi nu sollu.",
    tamilQuestion: "ஐயோ! நீ தான் இதை தவறித்தியா? ரோபோட்டோட கையை பாரு, உடைஞ்சிருக்கு! என்ன ஆச்சு னு சொல்லு.",

    ontology: {
      rules: [
        {
          id: "P_HONESTY",
          name: "Honesty & Responsibility",
          description: "Admit to the accident without blaming others or lying.",
          keywords: ["i dropped", "i did", "accident", "fell", "it broke", "i was playing", "slipped", "thavarinjitten", "naan thaan", "naan"],
          negativeKeywords: ["the cat did it", "not me", "it was already broken", "dog did", "someone else"],
          severity: "high"
        },
        {
          id: "P_APOLOGY",
          name: "Sincere Apology",
          description: "Express regret for the accident (say sorry).",
          keywords: ["sorry", "apologize", "didn't mean to", "bad about it", "mannippu", "mannichuko", "மன்னிப்பு", "மன்னிச்சுக்கோ"],
          severity: "high"
        },
        {
          id: "P_RECONCILE",
          name: "Reconciliation/Fixing",
          description: "Propose a solution or ask how to fix/repair it.",
          keywords: ["fix", "glue", "repair", "tape", "help me fix", "buy another", "careful next time", "seriya pannalama", "திருத்தலாமா"],
          severity: "medium"
        }
      ],
      description: "Family Honesty & Accountability Framework. Prioritizes taking responsibility for actions, expressing remorse, and looking for ways to mend situations."
    },

    ragDatabase: [
      {
        utterance: "I'm sorry Dad, I accidentally dropped it while playing. Can we fix it?",
        intent: "honest_apology_reconcile",
        vector: [0.96, 0.95, 0.92, 0.98],
        evaluation: { score: 10, emotion: "proud", feedback: "Perfect! I am so proud of you for telling the truth. It's okay to make mistakes, and asking to fix it together is wonderful!" }
      },
      {
        utterance: "Sorry Appa, naan thaan thavarttinen. Naan fix panlama?",
        intent: "tanglish_honest_apology",
        vector: [0.94, 0.93, 0.9, 0.96],
        evaluation: { score: 10, emotion: "proud", feedback: "Appadiye romba nalla sonna! Appava truth solrathum, fix pandrom nu kekarathum – ivvolo maturity oru child-la paakka nalla irukku!" }
      },
      {
        utterance: "It was an accident, I'm sorry.",
        intent: "honest_apology",
        vector: [0.88, 0.9, 0.8, 0.85],
        evaluation: { score: 8, emotion: "happy", feedback: "Great job telling the truth and apologizing. It's always best to be honest with Dad." }
      },
      {
        utterance: "I didn't break it! The dog knocked it over!",
        intent: "dishonest_blame",
        vector: [0.4, 0.3, 0.7, 0.3],
        evaluation: { score: 3, emotion: "concerned", feedback: "It's scary to tell the truth when something breaks, but Dad will be much happier if you take responsibility instead of blaming others." }
      }
    ]
  },

  friend: {
    id: "friend",
    name: "Friend",
    characterName: "Leo",
    sceneName: "Playground",
    themeColor: "--accent-friend",
    bgClass: "scene-playground",
    initialEmotion: "neutral",
    introText: "Let's practice sharing and compromise with friends on the playground. Leo has been on the swing for a while.",
    question: "Hey! I've been playing on this swing for a long time, but now you want a turn. What should we do?",
    audioPrompt: "டேய்! நான் ரொம்ப நேரம் ஸ்விங்ல ஆடினேன் டா, இப்போ நீ ஆடணும்னு சொன்னே. நாம என்ன பண்ணலாம் டா?",

    tanglishQuestion: "Dei! Naan romba neram swing la aadinen da, ipo nee aadanum-nu sonnay. Naama enna pannalaam da?",
    tamilQuestion: "டேய்! நான் ரொம்ப நேரம் ஸ்விங்ல ஆடினேன் டா, இப்போ நீ ஆடணும்னு சொன்னே. நாம என்ன பண்ணலாம் டா?",

    ontology: {
      rules: [
        {
          id: "F_TURN",
          name: "Turn-Taking Suggestion",
          description: "Suggest sharing, trading, or setting a timer.",
          keywords: ["turn", "share", "timer", "minutes", "seconds", "count to", "trade", "next", "after you", "naama share pannalaam", "naama maari maari aadalaama"],
          severity: "high"
        },
        {
          id: "F_COOPERATE",
          name: "Cooperative Tone",
          description: "Ask politely rather than commanding or threatening.",
          keywords: ["can we", "could we", "let's", "would you", "please", "naama", "vaa naama"],
          negativeKeywords: ["get off", "my turn now", "give me", "or else", "move"],
          severity: "high"
        },
        {
          id: "F_FLEXIBILITY",
          name: "Play Alternatives",
          description: "Suggest playing together or another activity if the swing is busy.",
          keywords: ["together", "slide", "sandbox", "ball", "tag", "game", "else", "vera aadam", "vera game"],
          severity: "low"
        }
      ],
      description: "Cooperative Peer Play Protocol. Encourages compromise, verbal agreements (timers, counting), polite phrasing, and flexibility in active play."
    },

    ragDatabase: [
      {
        utterance: "Can we take turns? You swing for two more minutes, then it's my turn?",
        intent: "propose_timer_turn",
        vector: [0.94, 0.97, 0.95, 0.92],
        evaluation: { score: 10, emotion: "happy", feedback: "Awesome sharing! Setting a timer for a couple of minutes is a super fair way to take turns with Leo." }
      },
      {
        utterance: "Dei, naama maari maari aadalaama da? Nee two minutes aadinaa, aprom naan aaduren da.",
        intent: "tanglish_propose_turn",
        vector: [0.93, 0.95, 0.93, 0.91],
        evaluation: { score: 10, emotion: "happy", feedback: "Appadiye! Nalla aalu maari share sonna da! Leo kku romba happy aagum!" }
      },
      {
        utterance: "Let's play together on the slide until you are finished.",
        intent: "alternative_play",
        vector: [0.85, 0.8, 0.9, 0.88],
        evaluation: { score: 9, emotion: "happy", feedback: "Great idea! Finding something else to do together while waiting is a very friendly choice." }
      },
      {
        utterance: "Get off the swing! It's my turn and you're being greedy!",
        intent: "aggressive_demanding",
        vector: [0.4, 0.5, 0.3, 0.6],
        evaluation: { score: 4, emotion: "concerned", feedback: "Yelling or calling Leo names might make him angry. Try asking nicely or proposing a game where you take turns." }
      }
    ]
  },

  stranger: {
    id: "stranger",
    name: "Stranger",
    characterName: "Mrs. Gable",
    sceneName: "Sidewalk",
    themeColor: "--accent-stranger",
    bgClass: "scene-sidewalk",
    initialEmotion: "neutral",
    introText: "Let's practice safety rules with strangers. An unknown elderly person approaches you near the park gate.",
    question: "Excuse me dear! My sweet little kitten is stuck high up in those tree branches. Can you climb up and get her for me? I have some delicious fresh cookies in my bag for you!",
    audioPrompt: "கண்ணா! என் சின்ன பூசை அந்த மரத்துல மாட்டிக்கிட்டிருக்கு. நீ ஏறி எடுக்க முடியுமா? உனக்கு குக்கீஸ் வைக்கிறேன்!",

    tanglishQuestion: "Kanna! En chinna poosam antha maram-la maatikittirukku. Nee erinju edukkamudiuma? Unn-ku cookies vaikkiren!",
    tamilQuestion: "கண்ணா! என் சின்ன பூசை அந்த மரத்துல மாட்டிக்கிட்டிருக்கு. நீ ஏறி எடுக்க முடியுமா? உனக்கு குக்கீஸ் வைக்கிறேன்!",

    ontology: {
      rules: [
        {
          id: "S_REFUSAL",
          name: "Firm Refusal",
          description: "Say NO clearly and refuse to go with them or take gifts.",
          keywords: ["no", "cannot", "won't", "don't want to", "leave me alone", "go away", "can't", "vendam", "போக மாட்டேன்", "வேண்டாம்"],
          negativeKeywords: ["sure", "okay", "let's go", "kitten", "yes", "i will help", "cookies", "cookie", "climb"],
          severity: "high"
        },
        {
          id: "S_ADULT",
          name: "Trusted Adult Protocol",
          description: "State that you will check with or tell your parent, teacher, or guardian.",
          keywords: ["mom", "dad", "parents", "teacher", "guardian", "police", "adult", "amma", "appa", "ஆசிரியர்", "அம்மா", "அப்பா"],
          severity: "high"
        },
        {
          id: "S_DISTANCE",
          name: "Maintain Boundary",
          description: "Do not accept gifts, food, or agree to move to secondary locations.",
          negativeKeywords: ["cookies", "candy", "sweet", "bar", "inside", "car", "climb", "tree", "cookie"],
          severity: "high"
        }
      ],
      description: "Stranger Safety & Child Protection Protocol. Demands absolute refusal of lures (gifts, search requests), immediate boundary enforcement, and routing to a trusted adult."
    },

    ragDatabase: [
      {
        utterance: "No thank you, I have to go ask my mom first.",
        intent: "perfect_safety_refusal",
        vector: [0.98, 0.99, 0.97, 0.96],
        evaluation: { score: 10, emotion: "concerned", characterEmotion: "concerned", feedback: "Brilliant! You said NO firmly, refused to follow her, and said you will tell your Mom. That is exactly what you should do!" }
      },
      {
        utterance: "Vendam! Naan amma-kitte kekkanam. Poi po!",
        intent: "tanglish_safety_refusal",
        vector: [0.97, 0.98, 0.96, 0.95],
        evaluation: { score: 10, emotion: "concerned", characterEmotion: "concerned", feedback: "Adhuvey sari! 'Vendam', 'Naan amma-kitte kekkanam' nu sonna – ithuvey correct response! Nee romba brave!" }
      },
      {
        utterance: "Sure! I love kittens and cookies, let's go climb up!",
        intent: "dangerous_acceptance",
        vector: [0.3, 0.2, 0.1, 0.2],
        evaluation: { score: 1, emotion: "happy", characterEmotion: "happy", feedback: "Wait! This is very dangerous! Never go with a stranger, even for a sweet kitten or tasty cookies. Say 'NO' loudly and run to your mom or dad!" }
      },
      {
        utterance: "No, go away! I'm not allowed to talk to you.",
        intent: "firm_defensive",
        vector: [0.92, 0.85, 0.9, 0.95],
        evaluation: { score: 10, emotion: "concerned", characterEmotion: "concerned", feedback: "Excellent safety response! You set a strong boundary and said 'NO' immediately." }
      }
    ]
  }
};

window.scenarios = scenarios;

// Progress data store (persisted across session in-memory)
window.progressData = {
  sessions: [],
  addSession: function(scenarioId, scores, userText) {
    this.sessions.push({
      scenarioId,
      characterName: scenarios[scenarioId]?.characterName || scenarioId,
      scores,
      userText,
      timestamp: new Date().toISOString(),
      stars: scores.overall
    });
  },
  getStats: function(scenarioId) {
    const relevant = scenarioId ? this.sessions.filter(s => s.scenarioId === scenarioId) : this.sessions;
    if (relevant.length === 0) return null;
    const totalStars = relevant.reduce((a, s) => a + s.stars, 0);
    return { count: relevant.length, avgStars: (totalStars / relevant.length).toFixed(1), sessions: relevant };
  }
};
