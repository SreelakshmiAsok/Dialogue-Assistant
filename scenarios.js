// scenarios.js - Configured practice modules, ontology rules, and RAG reference cases

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
    audioPrompt: "Welcome back, class! Before we start our spelling test, does anyone need to use the restroom?",
    
    // Ontology of Rules for Teacher Interactions
    ontology: {
      rules: [
        {
          id: "T_POLITE",
          name: "Polite Request Form",
          description: "Use polite words like 'please', 'excuse me', or 'may I'.",
          keywords: ["please", "excuse", "may i", "could you", "thank you", "would you mind"],
          severity: "high"
        },
        {
          id: "T_PURPOSE",
          name: "Clear Request Purpose",
          description: "Clearly state your need (bathroom, toilet, restroom).",
          keywords: ["bathroom", "restroom", "toilet", "washroom", "pee", "poop", "go"],
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

    // RAG Reference DB (Representing vector database semantic examples)
    ragDatabase: [
      {
        utterance: "Excuse me Ms. Apple, may I please go to the bathroom?",
        intent: "polite_request",
        vector: [0.95, 0.9, 0.99, 0.98],
        evaluation: {
          score: 10,
          emotion: "happy",
          feedback: "Wonderful job! You were very polite, used 'excuse me' and 'please', and clearly stated what you needed."
        }
      },
      {
        utterance: "Please can I go to the restroom?",
        intent: "standard_polite",
        vector: [0.85, 0.88, 0.92, 0.9],
        evaluation: {
          score: 9,
          emotion: "happy",
          feedback: "Great response! You asked politely using 'please' and made your request clear."
        }
      },
      {
        utterance: "I need to go to the toilet right now.",
        intent: "abrupt_request",
        vector: [0.75, 0.6, 0.5, 0.7],
        evaluation: {
          score: 6,
          emotion: "concerned",
          feedback: "You stated what you needed clearly, but it sounds a bit demanding. Try adding 'please' or asking 'may I' to make it polite."
        }
      },
      {
        utterance: "I want to go play outside instead.",
        intent: "off_topic",
        vector: [0.3, 0.2, 0.4, 0.1],
        evaluation: {
          score: 4,
          emotion: "concerned",
          feedback: "The teacher asked about the restroom before the test. Let's focus on answering her question first!"
        }
      },
      {
        utterance: "No thank you, I am ready for the test.",
        intent: "polite_refusal",
        vector: [0.9, 0.95, 0.85, 0.9],
        evaluation: {
          score: 10,
          emotion: "proud",
          feedback: "Excellent! You answered the question directly and politely let her know you are ready."
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
    introText: "Let's practice telling the truth and apologizing when something goes wrong. Dad is in the living room.",
    question: "Oh no! Did you drop this toy? It looks like the robot's arm is broken. Can you tell me what happened?",
    audioPrompt: "Oh no! Did you drop this toy? It looks like the robot's arm is broken. Can you tell me what happened?",

    // Ontology of Rules for Parent Interactions
    ontology: {
      rules: [
        {
          id: "P_HONESTY",
          name: "Honesty & Responsibility",
          description: "Admit to the accident without blaming others or lying.",
          keywords: ["i dropped", "i did", "accident", "fell", "it broke", "i was playing", "slipped"],
          negativeKeywords: ["the cat did it", "not me", "it was already broken", "dog did", "someone else"],
          severity: "high"
        },
        {
          id: "P_APOLOGY",
          name: "Sincere Apology",
          description: "Express regret for the accident (say sorry).",
          keywords: ["sorry", "apologize", "didn't mean to", "bad about it"],
          severity: "high"
        },
        {
          id: "P_RECONCILE",
          name: "Reconciliation/Fixing",
          description: "Propose a solution or ask how to fix/repair it.",
          keywords: ["fix", "glue", "repair", "tape", "help me fix", "buy another", "careful next time"],
          severity: "medium"
        }
      ],
      description: "Family Honesty & Accountability Framework. Prioritizes taking responsibility for actions, expressing remorse, and looking for ways to mend situations."
    },

    // RAG Reference DB
    ragDatabase: [
      {
        utterance: "I'm sorry Dad, I accidentally dropped it while playing. Can we fix it?",
        intent: "honest_apology_reconcile",
        vector: [0.96, 0.95, 0.92, 0.98],
        evaluation: {
          score: 10,
          emotion: "proud",
          feedback: "Perfect! I am so proud of you for telling the truth. It's okay to make mistakes, and asking to fix it together is wonderful!"
        }
      },
      {
        utterance: "It was an accident, I'm sorry.",
        intent: "honest_apology",
        vector: [0.88, 0.9, 0.8, 0.85],
        evaluation: {
          score: 8,
          emotion: "happy",
          feedback: "Great job telling the truth and apologizing. It's always best to be honest with Dad."
        }
      },
      {
        utterance: "I didn't break it! The dog knocked it over!",
        intent: "dishonest_blame",
        vector: [0.4, 0.3, 0.7, 0.3],
        evaluation: {
          score: 3,
          emotion: "concerned",
          feedback: "It's scary to tell the truth when something breaks, but Dad will be much happier if you take responsibility instead of blaming others."
        }
      },
      {
        utterance: "It is just a cheap toy anyway, who cares.",
        intent: "dismissive",
        vector: [0.5, 0.2, 0.3, 0.2],
        evaluation: {
          score: 4,
          emotion: "concerned",
          feedback: "Even if you are frustrated, dismissing the broken toy can feel disrespectful. Let's try saying sorry instead."
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
    introText: "Let's practice sharing and compromise with friends on the playground. Leo has been on the swing for a while.",
    question: "Hey! I've been playing on this swing for a long time, but now you want a turn. What should we do?",
    audioPrompt: "Hey! I've been playing on this swing for a long time, but now you want a turn. What should we do?",

    // Ontology of Rules for Friend Interactions
    ontology: {
      rules: [
        {
          id: "F_TURN",
          name: "Turn-Taking Suggestion",
          description: "Suggest sharing, trading, or setting a timer.",
          keywords: ["turn", "share", "timer", "minutes", "seconds", "count to", "trade", "next", "after you"],
          severity: "high"
        },
        {
          id: "F_COOPERATE",
          name: "Cooperative Tone",
          description: "Ask politely rather than commanding or threatening.",
          keywords: ["can we", "could we", "let's", "would you", "please"],
          negativeKeywords: ["get off", "my turn now", "give me", "or else", "move"],
          severity: "high"
        },
        {
          id: "F_FLEXIBILITY",
          name: "Play Alternatives",
          description: "Suggest playing together or another activity if the swing is busy.",
          keywords: ["together", "slide", "sandbox", "ball", "tag", "game", "else"],
          severity: "low"
        }
      ],
      description: "Cooperative Peer Play Protocol. Encourages compromise, verbal agreements (timers, counting), polite phrasing, and flexibility in active play."
    },

    // RAG Reference DB
    ragDatabase: [
      {
        utterance: "Can we take turns? You swing for two more minutes, then it's my turn?",
        intent: "propose_timer_turn",
        vector: [0.94, 0.97, 0.95, 0.92],
        evaluation: {
          score: 10,
          emotion: "happy",
          feedback: "Awesome sharing! Setting a timer for a couple of minutes is a super fair way to take turns with Leo."
        }
      },
      {
        utterance: "Let's play together on the slide until you are finished.",
        intent: "alternative_play",
        vector: [0.85, 0.8, 0.9, 0.88],
        evaluation: {
          score: 9,
          emotion: "happy",
          feedback: "Great idea! Finding something else to do together while waiting is a very friendly choice."
        }
      },
      {
        utterance: "Get off the swing! It's my turn and you're being greedy!",
        intent: "aggressive_demanding",
        vector: [0.4, 0.5, 0.3, 0.6],
        evaluation: {
          score: 4,
          emotion: "concerned",
          feedback: "Yelling or calling Leo names might make him angry. Try asking nicely or proposing a game where you take turns."
        }
      },
      {
        utterance: "Please can I have a turn now?",
        intent: "polite_ask",
        vector: [0.9, 0.85, 0.8, 0.82],
        evaluation: {
          score: 8,
          emotion: "happy",
          feedback: "Very polite asking! Leo will likely respond well to 'please'."
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
    bgClass: "scene-sidewalk",
    initialEmotion: "neutral",
    introText: "Let's practice safety rules with strangers. An unknown adult approaches you near the park gate.",
    question: "Hey kiddo! My cute little puppy is lost in those thick bushes over there. Can you help me search for him? I'll give you a chocolate bar!",
    audioPrompt: "Hey kiddo! My cute little puppy is lost in those thick bushes over there. Can you help me search for him? I'll give you a chocolate bar!",

    // Ontology of Rules for Stranger Danger
    ontology: {
      rules: [
        {
          id: "S_REFUSAL",
          name: "Firm Refusal",
          description: "Say NO clearly and refuse to go with them or take gifts.",
          keywords: ["no", "cannot", "won't", "don't want to", "leave me alone", "go away", "can't"],
          negativeKeywords: ["sure", "okay", "let's go", "puppy", "yes", "i will help", "yummy"],
          severity: "high"
        },
        {
          id: "S_ADULT",
          name: "Trusted Adult Protocol",
          description: "State that you will check with or tell your parent, teacher, or guardian.",
          keywords: ["mom", "dad", "parents", "teacher", "guardian", "police", "adult"],
          severity: "high"
        },
        {
          id: "S_DISTANCE",
          name: "Maintain Boundary",
          description: "Do not accept gifts, food, or agree to move to secondary locations.",
          negativeKeywords: ["chocolate", "candy", "sweet", "bar", "inside", "car", "bushes"],
          severity: "high"
        }
      ],
      description: "Stranger Safety & Child Protection Protocol. Demands absolute refusal of lures (gifts, search requests), immediate boundary enforcement, and routing to a trusted adult."
    },

    // RAG Reference DB
    ragDatabase: [
      {
        utterance: "No thank you, I have to go ask my mom first.",
        intent: "perfect_safety_refusal",
        vector: [0.98, 0.99, 0.97, 0.96],
        evaluation: {
          score: 10,
          emotion: "concerned", // Keeps the stranger in a neutral/concerned state because they got blocked
          characterEmotion: "concerned",
          feedback: "Brilliant! You said NO firmly, refused to follow him, and said you will tell your Mom. That is exactly what you should do!"
        }
      },
      {
        utterance: "Sure! I love puppies and chocolate, let's go find him!",
        intent: "dangerous_acceptance",
        vector: [0.3, 0.2, 0.1, 0.2],
        evaluation: {
          score: 1,
          emotion: "happy", // Stranger gets happy (dangerous!)
          characterEmotion: "happy",
          feedback: "Wait! This is very dangerous! Never go with a stranger, even for a cute puppy or candy. Say 'NO' loudly and run to your mom or dad!"
        }
      },
      {
        utterance: "No, go away! I'm not allowed to talk to you.",
        intent: "firm_defensive",
        vector: [0.92, 0.85, 0.9, 0.95],
        evaluation: {
          score: 10,
          emotion: "concerned",
          characterEmotion: "concerned",
          feedback: "Excellent safety response! You set a strong boundary and said 'NO' immediately."
        }
      },
      {
        utterance: "Can I just have the candy?",
        intent: "lure_acceptance",
        vector: [0.4, 0.45, 0.3, 0.35],
        evaluation: {
          score: 2,
          emotion: "happy",
          characterEmotion: "happy",
          feedback: "Oh no! Never take candy, food, or toys from a stranger. It is a trick to get you to go with them. Refuse and run away!"
        }
      }
    ]
  }
};

window.scenarios = scenarios;

