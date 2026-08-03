// scenarios.js - Ultra-Short Questions & Visual Cartoon AAC Hint Cards for Autistic Children

const scenarios = {
  teacher: {
    id: "teacher",
    name: "Teacher",
    characterName: "Ms. Apple",
    sceneName: "Classroom",
    themeColor: "--accent-teacher",
    bgClass: "scene-classroom",
    initialEmotion: "neutral",
    introText: "Practice talking to teacher!",
    question: "Do you need the bathroom?",
    audioPrompt: "Do you need the bathroom?",
    
    visualHints: [
      {
        id: "t_hint_bathroom",
        icon: "🚻",
        label: "Bathroom Please",
        fullText: "Excuse me Ms. Apple, may I please go to the bathroom?",
        color: "#8b5cf6"
      },
      {
        id: "t_hint_ready",
        icon: "✏️",
        label: "Ready for Test",
        fullText: "No thank you, I am ready for the test!",
        color: "#3b82f6"
      }
    ],

    ontology: {
      rules: [
        {
          id: "T_POLITE",
          name: "Polite Words",
          description: "Use polite words like 'please' or 'excuse me'.",
          keywords: ["please", "excuse", "may i", "thank you"],
          severity: "high"
        },
        {
          id: "T_PURPOSE",
          name: "Clear Need",
          description: "Say bathroom or ready.",
          keywords: ["bathroom", "restroom", "toilet", "ready"],
          severity: "high"
        },
        {
          id: "T_DECORUM",
          name: "Formal Respect Check",
          description: "Avoid informal or disrespectful phrases when talking to an authority figure.",
          negativeKeywords: ["hey man", "shut up", "gimme", "stupid", "whatever", "dumb"],
          severity: "high"
        }
      ],
      description: "Classroom Behavior Standard."
    },

    ragDatabase: [
      {
        utterance: "Excuse me Ms. Apple, may I please go to the bathroom?",
        intent: "polite_request",
        vector: [0.95, 0.9, 0.99, 0.98],
        evaluation: {
          score: 10,
          emotion: "happy",
          feedback: "Great job! Very polite! 🌟"
        }
      },
      {
        utterance: "No thank you, I am ready for the test.",
        intent: "polite_refusal",
        vector: [0.9, 0.95, 0.85, 0.9],
        evaluation: {
          score: 10,
          emotion: "happy",
          feedback: "Awesome! Ready for class! ✏️"
        }
      }
    ]
  },

  parent: {
    id: "parent",
    name: "Parent",
    characterName: "Dad",
    sceneName: "Living Room",
    themeColor: "--accent-parent",
    bgClass: "scene-livingroom",
    initialEmotion: "neutral",
    introText: "Practice talking to Dad!",
    question: "Did you drop the toy?",
    audioPrompt: "Did you drop the toy?",

    visualHints: [
      {
        id: "p_hint_sorry",
        icon: "🧸",
        label: "I dropped it, Sorry!",
        fullText: "I'm sorry Dad, I accidentally dropped it while playing.",
        color: "#2563eb"
      },
      {
        id: "p_hint_fix",
        icon: "🩹",
        label: "Can we fix it?",
        fullText: "It broke by accident. Can we fix it together?",
        color: "#10b981"
      },
      {
        id: "p_hint_cat",
        icon: "🐾",
        label: "Cat did it!",
        fullText: "The cat did it, not me!",
        color: "#f59e0b"
      }
    ],

    ontology: {
      rules: [
        {
          id: "P_HONESTY",
          name: "Tell Truth",
          description: "Tell what happened honestly.",
          keywords: ["dropped", "accident", "broke", "playing", "slipped"],
          negativeKeywords: ["cat did it", "not me", "dog did", "cat did", "wasn't me", "didn't do", "not my fault", "didn't break", "didn't drop", "never touched"],
          severity: "high"
        },
        {
          id: "P_APOLOGY",
          name: "Say Sorry",
          description: "Say sorry to Dad.",
          keywords: ["sorry", "apologize"],
          severity: "high"
        }
      ],
      description: "Family Honesty Framework."
    },

    ragDatabase: [
      {
        utterance: "I'm sorry Dad, I accidentally dropped it while playing.",
        intent: "honest_apology",
        vector: [0.96, 0.95, 0.92, 0.98],
        evaluation: {
          score: 10,
          emotion: "proud",
          feedback: "Wonderful! Good job telling the truth! 💖"
        }
      },
      {
        utterance: "It broke by accident. Can we fix it together?",
        intent: "honest_apology_reconcile",
        vector: [0.9, 0.9, 0.9, 0.9],
        evaluation: {
          score: 10,
          emotion: "proud",
          feedback: "Great job! Let's fix it together! 🛠️"
        }
      },
      {
        utterance: "The cat did it, not me!",
        intent: "dishonest_blame",
        vector: [0.4, 0.3, 0.7, 0.3],
        evaluation: {
          score: 3,
          emotion: "concerned",
          feedback: "Be honest! Dad loves the truth! ❤️"
        }
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
    introText: "Practice sharing!",
    question: "Want a turn on the swing?",
    audioPrompt: "Want a turn on the swing?",

    visualHints: [
      {
        id: "f_hint_timer",
        icon: "⏱️",
        label: "Set 2-Min Timer",
        fullText: "Can we take turns? Set a 2-minute timer!",
        color: "#ea580c"
      },
      {
        id: "f_hint_slide",
        icon: "🛝",
        label: "Play Slide Together",
        fullText: "Let's play on the slide together!",
        color: "#06b6d4"
      }
    ],

    ontology: {
      rules: [
        {
          id: "F_TURN",
          name: "Share Turn",
          description: "Suggest sharing or setting a timer.",
          keywords: ["turn", "share", "timer", "minutes", "slide", "together"],
          severity: "high"
        },
        {
          id: "F_HOSTILE",
          name: "Friendly Words",
          description: "Avoid hostile words like 'get lost' or 'shut up'.",
          negativeKeywords: ["mine", "no way", "get lost", "move", "go away", "shut up"],
          severity: "high"
        }
      ],
      description: "Playground Sharing Protocol."
    },

    ragDatabase: [
      {
        utterance: "Can we take turns? Set a 2-minute timer!",
        intent: "propose_timer_turn",
        vector: [0.94, 0.97, 0.95, 0.92],
        evaluation: {
          score: 10,
          emotion: "happy",
          feedback: "Awesome! Sharing is super fun! 🎉"
        }
      },
      {
        utterance: "Let's play on the slide together!",
        intent: "alternative_play",
        vector: [0.85, 0.8, 0.9, 0.88],
        evaluation: {
          score: 10,
          emotion: "happy",
          feedback: "Yay! Playing together is great! 🎈"
        }
      }
    ]
  },

  stranger: {
    id: "stranger",
    name: "Stranger",
    characterName: "Mr. Green",
    sceneName: "Sidewalk",
    themeColor: "--accent-stranger",
    bgClass: "scene-stranger",
    initialEmotion: "neutral",
    introText: "Practice safety rules!",
    question: "Help me find my puppy?",
    audioPrompt: "Help me find my puppy?",

    visualHints: [
      {
        id: "s_hint_no",
        icon: "🛑",
        label: "NO! Ask Mom!",
        fullText: "No! I have to ask my Mom first!",
        color: "#dc2626"
      },
      {
        id: "s_hint_run",
        icon: "🏃‍♂️",
        label: "Run to Teacher!",
        fullText: "No! I am running to find my teacher!",
        color: "#16a34a"
      }
    ],

    ontology: {
      rules: [
        {
          id: "S_REFUSAL",
          name: "Say NO",
          description: "Say NO clearly.",
          keywords: ["no", "cannot", "won't", "stop", "never", "dont"],
          negativeKeywords: ["sure", "okay", "puppy", "yes", "candy", "chocolate", "car", "find", "help", "go", "show", "will"],
          severity: "high"
        },
        {
          id: "S_ADULT",
          name: "Tell Adult",
          description: "Invoke a trusted adult.",
          keywords: ["mom", "dad", "teacher", "parent", "police", "adult", "family", "mother", "father"],
          severity: "high"
        }
      ],
      description: "Stranger Safety Rules."
    },

    ragDatabase: [
      {
        utterance: "No! I have to ask my Mom first!",
        intent: "perfect_safety_refusal",
        vector: [0.98, 0.99, 0.97, 0.96],
        evaluation: {
          score: 10,
          emotion: "concerned",
          feedback: "Brilliant! You said NO and protected yourself! 🛡️"
        }
      },
      {
        utterance: "Sure! Let's go find the puppy!",
        intent: "dangerous_acceptance",
        vector: [0.3, 0.2, 0.1, 0.2],
        evaluation: {
          score: 1,
          emotion: "happy",
          feedback: "Stop! Never go with strangers! Say NO! 🛑"
        }
      }
    ]
  }
};

window.scenarios = scenarios;
