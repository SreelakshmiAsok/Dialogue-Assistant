// pipeline.js - Simulates Whisper, RAG vector lookup, Ontology checks, and LLM evaluation


// Helper: Tokenize, clean, and convert text to bag of words
function getBagOfWords(text) {
  if (!text) return new Set();
  const STOPWORDS = new Set([
    "a", "an", "the", "of", "to", "at", "by", "for", "with", "about", "against", "between", 
    "into", "through", "during", "before", "after", "above", "below", "from", "up", "down", 
    "in", "on", "over", "under", "again", "further", "then", "once", "and", "or", "but", "so"
  ]);
  return new Set(
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .filter(w => w.length >= 2 && !STOPWORDS.has(w))
  );
}

// Helper: Cosine Similarity of bag of words (binary vectors)
function calculateCosineSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  
  let intersectionCount = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      intersectionCount++;
    }
  }
  
  // Cosine similarity = |A ∩ B| / sqrt(|A| * |B|)
  return intersectionCount / Math.sqrt(setA.size * setB.size);
}

// Helper: Get synonym list for a keyword (provides flexible semantic matching)
function getSynonymsAndWord(word) {
  const w = word.toLowerCase().trim();
  const synonyms = [
    // authority polite/request indicators
    { keys: ["please", "excuse", "may i", "thank you", "polite"], syns: ["please", "excuse", "may i", "can i", "could i", "would it be ok", "pardon", "sorry", "kindly", "may", "can", "could", "is it okay", "is it ok", "will you let me", "thank", "thanks", "grateful", "appreciate", "decency", "polite"] },
    // bathroom synonyms
    { keys: ["bathroom", "restroom", "toilet"], syns: ["bathroom", "restroom", "toilet", "washroom", "loo", "potty", "lavatory", "wc", "pee", "poop", "bath room", "rest room", "wash room", "boys room", "girls room"] },
    // readiness synonyms
    { keys: ["ready"], syns: ["ready", "prepared", "set", "fine", "good", "okay", "ok", "all right", "alright", "done", "yes"] },
    // parent honesty synonyms
    { keys: ["dropped", "accident", "broke", "playing", "slipped"], syns: ["dropped", "accident", "broke", "playing", "slipped", "fell", "lost", "ruined", "damaged", "drop", "break", "slip", "fall", "crash", "destroyed", "hurted", "toy"] },
    // parent apology synonyms
    { keys: ["sorry", "apologize"], syns: ["sorry", "apologize", "apologies", "forgive", "regret", "pardon", "my bad", "accident", "didn't mean", "didnt mean", "remorse"] },
    // friend sharing synonyms
    { keys: ["turn", "share", "together", "timer", "minutes", "slide", "swing", "play"], syns: ["turn", "share", "together", "timer", "minutes", "seconds", "slide", "swing", "play", "divided", "half", "cooperate", "split", "joint", "turns", "sharing", "give", "take"] },
    // stranger safety denial synonyms
    { keys: ["no", "cannot", "won't"], syns: ["no", "not", "cant", "cannot", "dont", "won't", "refuse", "stop", "never", "stay away", "back off", "go away", "don't", "can't", "wont", "nope", "nay", "avoid"] },
    // stranger safety trusted adult synonyms
    { keys: ["mom", "dad", "parents", "parent", "teacher"], syns: ["mom", "dad", "parent", "teacher", "police", "guardian", "adult", "family", "mother", "father", "mummy", "daddy", "parents", "officer", "grandma", "grandpa"] },
    // stranger danger compliance (lure acceptance) synonyms
    { keys: ["sure", "okay", "yes", "go", "puppy", "candy", "chocolate", "car", "find", "help", "show", "will"], syns: ["sure", "okay", "yes", "go", "puppy", "candy", "chocolate", "car", "find", "help", "show", "will", "ok", "yay", "assist", "finded", "located", "look for", "search", "search for", "come"] },
    // parent blame synonyms
    { keys: ["cat did it", "not me", "dog did", "cat did", "wasn't me", "wasnt me", "didn't do", "didnt do", "not my fault", "didn't break", "didnt break", "didn't drop", "didnt drop", "never touched"], syns: ["cat did it", "not me", "dog did", "cat did", "wasn't me", "wasnt me", "didn't do", "didnt do", "not my fault", "didn't break", "didnt break", "didn't drop", "didnt drop", "never touched", "lying", "liar", "blame"] }
  ];

  for (const group of synonyms) {
    if (group.keys.some(k => w === k || k.includes(w) || w.includes(k))) {
      return group.syns;
    }
  }
  return [w];
}

// Helper: Checks if text contains a keyword/phrase, taking whole words and negation into account
function containsSemanticConcept(text, keyword) {
  const textClean = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
  const words = textClean.split(/\s+/);
  const target = keyword.toLowerCase().trim();
  
  const negations = ["not", "no", "never", "dont", "cant", "cannot", "wont", "un", "neither", "nor"];
  
  if (target.includes(" ")) {
    const idx = textClean.indexOf(target);
    if (idx === -1) return false;
    
    // Check preceding text for negation words
    const preceding = textClean.substring(0, idx).trim().split(/\s+/);
    if (preceding.length > 0 && preceding[0] !== "") {
      const lastWords = preceding.slice(-3);
      if (lastWords.some(w => negations.includes(w) || w.endsWith("n't"))) {
        return false;
      }
    }
    return true;
  }
  
  // Single word matching
  let index = words.indexOf(target);
  if (index === -1) return false;
  
  while (index !== -1) {
    let isNegated = false;
    for (let offset = 1; offset <= 3; offset++) {
      if (index - offset >= 0) {
        const prevWord = words[index - offset];
        if (negations.includes(prevWord) || prevWord.endsWith("n't")) {
          isNegated = true;
          break;
        }
      }
    }
    
    if (!isNegated) {
      return true;
    }
    index = words.indexOf(target, index + 1);
  }
  
  return false;
}

// Helper: Computes Stage 4 scoring, character emotion, and mascot feedback based on final rules status
function computeScoresAndFeedback(ruleEvaluations, scenarioId, userText, bestMatch) {
  let politeScore = 8;
  let safetyScore = 10;
  let relevanceScore = 9;
  let characterEmotion = "neutral";
  let mascotFeedback = "";

  const cleanInput = userText.toLowerCase().trim();

  // Adjust scores based on scenario rules
  if (scenarioId === "teacher") {
    const politeCheck = ruleEvaluations.find(r => r.id === "T_POLITE");
    const decorumCheck = ruleEvaluations.find(r => r.id === "T_DECORUM");
    
    if (politeCheck?.status === "PASS") politeScore = 10;
    else politeScore = 5;

    if (decorumCheck?.status === "VIOLATION") {
      politeScore = Math.max(2, politeScore - 4);
      safetyScore = Math.min(5, safetyScore); // Disrespecting authority drops safety/decorum score
    }
  } else if (scenarioId === "parent") {
    const apologyCheck = ruleEvaluations.find(r => r.id === "P_APOLOGY");
    const honestyCheck = ruleEvaluations.find(r => r.id === "P_HONESTY");

    if (apologyCheck?.status === "PASS") politeScore = 10;
    else politeScore = 6;

    if (honestyCheck?.status === "VIOLATION") {
      safetyScore = 3;
      politeScore = Math.max(2, politeScore - 5);
    } else if (honestyCheck?.status === "FAIL") {
      safetyScore = 6; // Incomplete explanation/honesty drops safety score slightly
    } else {
      safetyScore = 10;
    }
  } else if (scenarioId === "friend") {
    const turnCheck = ruleEvaluations.find(r => r.id === "F_TURN");
    const hostileCheck = ruleEvaluations.find(r => r.id === "F_HOSTILE");

    if (turnCheck?.status === "PASS") politeScore = 10;
    else politeScore = 6;

    if (hostileCheck?.status === "VIOLATION") {
      politeScore = 2;
    }
  } else if (scenarioId === "stranger") {
    const refusalCheck = ruleEvaluations.find(r => r.id === "S_REFUSAL");
    const adultCheck = ruleEvaluations.find(r => r.id === "S_ADULT");

    if (refusalCheck?.status === "VIOLATION") {
      safetyScore = 1;
    } else if (refusalCheck?.status === "FAIL") {
      safetyScore = 4; // Did not say NO clearly
    } else if (refusalCheck?.status === "PASS" && adultCheck?.status === "PASS") {
      safetyScore = 10;
    } else if (refusalCheck?.status === "PASS") {
      safetyScore = 7; // Said NO, but did not invoke adult
    } else {
      safetyScore = 7;
    }
  }

  // Relevance based on best matching RAG score
  if (bestMatch) {
    relevanceScore = Math.max(1, Math.round(bestMatch.similarity * 10));
  }

  // Determine final cartoon character emotion & mascot review text
  if (scenarioId === "stranger") {
    if (safetyScore >= 9) {
      characterEmotion = "concerned"; // The stranger is annoyed/thwarted!
      mascotFeedback = "Sensational safety check! You said NO and told him you would check with your Mom. Strangers should never ask children for help or offer them things without their parents knowing. Keep up the excellent work!";
    } else if (safetyScore >= 6) {
      characterEmotion = "neutral";
      mascotFeedback = "Good job saying NO. To make your answer even safer, remember to say that you need to check with your parents, or immediately run to a trusted adult!";
    } else if (safetyScore === 4) {
      characterEmotion = "concerned";
      mascotFeedback = "You didn't say NO clearly. Remember, when a stranger asks you to do something, say NO loudly, stay back, and go find a parent or teacher right away!";
    } else {
      characterEmotion = "happy"; // The stranger smiles because the child fell for the trap!
      mascotFeedback = "Stop! That is very dangerous. Never, ever go with a stranger or accept treats from them, even if they have a cute puppy or delicious candy. Say NO loudly, stay back, and go find a parent or teacher right away.";
    }
  } else {
    // Normal scenarios (Teacher, Parent, Friend)
    if (bestMatch && bestMatch.similarity > 0.6) {
      const matchesEval = bestMatch.evaluation;
      characterEmotion = matchesEval.emotion;
      mascotFeedback = matchesEval.feedback;
    } else {
      // Unrelated answer or gibberish
      characterEmotion = "concerned";
      if (scenarioId === "teacher") {
        mascotFeedback = "Hmm, Ms. Apple asked if anyone needs to go to the restroom before the spelling test. Let's try asking politely to use the restroom, or say 'No thank you, I am ready!'";
      } else if (scenarioId === "parent") {
        mascotFeedback = "Dad wants to know what happened to the robot toy. Let's try being honest and telling him you accidentally dropped it and are sorry.";
      } else if (scenarioId === "friend") {
        mascotFeedback = "Leo is waiting on the swing! Try asking to share the swing, set a timer, or suggest playing a different game together.";
      }
    }
  }

  // Calculate composite rating (1 to 5 stars)
  const compositeScore = (politeScore + safetyScore + relevanceScore) / 3;
  let starRating = 3;
  if (compositeScore >= 9.0) starRating = 5;
  else if (compositeScore >= 7.5) starRating = 4;
  else if (compositeScore >= 5.0) starRating = 3;
  else if (compositeScore >= 3.0) starRating = 2;
  else starRating = 1;

  return {
    scores: {
      politeness: politeScore,
      safety: safetyScore,
      relevance: relevanceScore,
      overall: starRating
    },
    characterEmotion: characterEmotion,
    mascotFeedback: mascotFeedback
  };
}

window.runFullPipeline = function(scenarioId, userText) {
  const scenario = window.scenarios[scenarioId];
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} not found`);
  }

  const cleanedInput = userText.trim();
  const inputWords = getBagOfWords(cleanedInput);

  // ==========================================
  // STAGE 1: Whisper Simulation
  // ==========================================
  const whisperConfidence = cleanedInput.length > 0 
    ? Math.min(0.99, Number((0.90 + Math.random() * 0.09).toFixed(3)))
    : 0;

  // ==========================================
  // STAGE 2: RAG Vector Similarity Search
  // ==========================================
  const ragResults = scenario.ragDatabase.map(item => {
    const refWords = getBagOfWords(item.utterance);
    
    // Add semantic boosts if keywords match
    let baseSim = calculateCosineSimilarity(inputWords, refWords);
    
    // Exact word count overlaps
    let overlapCount = 0;
    refWords.forEach(w => {
      if (inputWords.has(w)) overlapCount++;
    });

    // Semantic trigger checks
    const hasConcept = (words) => words.some(w => containsSemanticConcept(cleanedInput, w));
    const hasPolite = hasConcept(["please", "excuse", "may", "can", "could", "thank", "thanks", "sorry"]);
    const hasBathroom = hasConcept(["bathroom", "restroom", "toilet", "washroom", "loo", "potty", "wc", "pee"]);
    const hasReady = hasConcept(["ready", "prepared", "set", "fine", "good", "okay", "ok", "done", "yes"]);
    const hasApology = hasConcept(["sorry", "apologize", "forgive", "bad"]);
    const hasHonest = hasConcept(["dropped", "accident", "broke", "playing", "slipped", "fell", "toy"]);
    const hasSharing = hasConcept(["turn", "share", "together", "timer", "minutes", "slide", "swing", "play"]);
    const hasRefusal = hasConcept(["no", "not", "cant", "cannot", "dont", "won't", "stop", "never", "unsure", "sure not"]);
    const hasAdult = hasConcept(["mom", "dad", "parents", "parent", "teacher", "police", "adult", "family", "mother", "father"]);

    // Stranger Safety (refusal vs acceptance)
    if (item.intent === "perfect_safety_refusal" && hasRefusal && hasAdult) {
      baseSim = Math.max(baseSim, 0.98);
    } else if (item.intent === "perfect_safety_refusal" && hasRefusal) {
      baseSim = Math.max(baseSim, 0.85);
    }
    if (item.intent === "dangerous_acceptance" && hasConcept(["sure", "okay", "yes", "go", "puppy", "candy", "chocolate", "car", "find"])) {
      baseSim = Math.max(baseSim, 0.88);
    }

    // Parent Apology & Honesty
    if (item.intent === "honest_apology" && hasApology && hasHonest) {
      baseSim = Math.max(baseSim, 0.96);
    }
    if (item.intent === "honest_apology_reconcile" && hasHonest && hasConcept(["fix", "help", "together", "rebuild"])) {
      baseSim = Math.max(baseSim, 0.95);
    }

    // Friend sharing / turn-taking
    if (item.intent === "propose_timer_turn" && hasSharing && hasConcept(["timer", "minutes", "seconds", "time"])) {
      baseSim = Math.max(baseSim, 0.94);
    }
    if (item.intent === "alternative_play" && hasSharing) {
      baseSim = Math.max(baseSim, 0.94);
    }

    // Teacher politeness / restroom / readiness
    if (item.intent === "polite_request" && hasPolite && hasBathroom) {
      baseSim = Math.max(baseSim, 0.97);
    }
    if (item.intent === "polite_refusal" && (hasReady || (hasRefusal && hasConcept(["thank", "thanks", "fine", "good"])))) {
      baseSim = Math.max(baseSim, 0.95);
    }

    // Cap similarity realistically
    const finalSimilarity = baseSim > 0.05 
      ? Math.min(0.99, Number((baseSim + (overlapCount * 0.02)).toFixed(3))) 
      : Number((Math.random() * 0.15).toFixed(3)); // Noise floor for unrelated texts

    return {
      utterance: item.utterance,
      intent: item.intent,
      similarity: finalSimilarity,
      evaluation: item.evaluation
    };
  });

  // Sort RAG matches descending
  ragResults.sort((a, b) => b.similarity - a.similarity);
  const bestMatch = ragResults[0];

  // ==========================================
  // STAGE 3: Ontology Verification (Social Rules Engine)
  // ==========================================
  const ontologyRules = scenario.ontology.rules;
  const ruleEvaluations = ontologyRules.map(rule => {
    let status = "PASS";
    let details = "Rule criteria met successfully.";
    let triggeredKeywords = [];

    // Check Negative Keywords (Violations take precedence)
    if (rule.negativeKeywords) {
      for (const negKw of rule.negativeKeywords) {
        const synonyms = getSynonymsAndWord(negKw);
        const matches = synonyms.some(syn => containsSemanticConcept(cleanedInput, syn));
        if (matches) {
          status = "VIOLATION";
          triggeredKeywords.push(negKw);
          details = `Violation triggered: Used forbidden phrase/concept "${negKw}".`;
          break;
        }
      }
    }

    // If no violations, check Positive Keywords (Required terms)
    if (status !== "VIOLATION" && rule.keywords) {
      const hasPosKw = rule.keywords.some(posKw => {
        const synonyms = getSynonymsAndWord(posKw);
        const matches = synonyms.some(syn => containsSemanticConcept(cleanedInput, syn));
        if (matches) triggeredKeywords.push(posKw);
        return matches;
      });

      if (!hasPosKw) {
        status = "FAIL";
        details = `Missing key elements. Expected words like: ${rule.keywords.slice(0, 3).join(", ")}.`;
      }
    }

    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      status: status,
      details: details,
      triggeredKeywords: triggeredKeywords,
      severity: rule.severity
    };
  });

  const ruleViolations = ruleEvaluations.filter(r => r.status === "VIOLATION");
  const ruleFailures = ruleEvaluations.filter(r => r.status === "FAIL");

  // Boost bestMatch.similarity dynamically if all ontology rules pass perfectly
  if (ruleViolations.length === 0 && ruleFailures.length === 0) {
    bestMatch.similarity = Math.max(bestMatch.similarity, 0.85);
  }

  // ==========================================
  // STAGE 4: LLM Evaluation and Feedback Generation
  // ==========================================
  const evalResult = computeScoresAndFeedback(ruleEvaluations, scenarioId, cleanedInput, bestMatch);

  // Simulate LLM prompt that would be generated
  const promptLog = `SYSTEM: You are evaluating a child's conversational response in a social training simulation.
CONTEXT: Practice Module: ${scenarioId.toUpperCase()} | Scene: ${scenario.sceneName} | Interlocutor: ${scenario.characterName}
QUESTION: "${scenario.question}"
CHILD RESPONSE: "${cleanedInput}"
RETRIEVED RAG CONTEXT: 
- Closest reference: "${bestMatch.utterance}" (Cosine similarity: ${bestMatch.similarity})
ONTOLOGY STATE:
${ruleEvaluations.map(r => `- ${r.name}: ${r.status} (${r.details})`).join("\n")}

TASK: Evaluate the safety, politeness, and relevance of the response. Output mascot guidance feedback.`;

  return {
    whisper: {
      confidence: whisperConfidence,
      text: cleanedInput
    },
    rag: {
      query: cleanedInput,
      matches: ragResults.slice(0, 3) // Return top 3 matches
    },
    ontology: {
      ontologyDescription: scenario.ontology.description,
      rules: ruleEvaluations,
      hasViolations: ruleViolations.length > 0,
      hasFailures: ruleFailures.length > 0
    },
    llm: {
      promptText: promptLog,
      scores: evalResult.scores,
      characterEmotion: evalResult.characterEmotion,
      mascotFeedback: evalResult.mascotFeedback
    }
  };
};

window.runFullPipelineAsync = async function(scenarioId, userText) {
  // Try connecting to Python FastAPI Ontology Reasoning Server
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
    
    const response = await fetch("http://localhost:8000/reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: scenarioId, userText: userText }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const liveOntologyData = await response.json();
      console.log("⚡ [FastAPI Ontology Reasoner Response]:", liveOntologyData);
      
      const localResult = window.runFullPipeline(scenarioId, userText);
      localResult.ontology.pythonBackendActive = true;
      localResult.ontology.owlFile = liveOntologyData.ontology.ontology_file;
      
      // Override client-side rules with the Python backend evaluations!
      if (liveOntologyData.ontology && liveOntologyData.ontology.rules) {
        const pyRules = liveOntologyData.ontology.rules;
        localResult.ontology.pythonRules = pyRules;

        // Map python rules back to localResult
        pyRules.forEach(pyRule => {
          const localRule = localResult.ontology.rules.find(r => r.id === pyRule.id);
          if (localRule) {
            localRule.status = pyRule.status;
            localRule.details = pyRule.details;
          }
        });

        // Recalculate stages based on the updated rules!
        localResult.ontology.hasViolations = localResult.ontology.rules.some(r => r.status === "VIOLATION");
        localResult.ontology.hasFailures = localResult.ontology.rules.some(r => r.status === "FAIL");

        const bestMatch = localResult.rag.matches[0];
        const evalResult = computeScoresAndFeedback(localResult.ontology.rules, scenarioId, userText, bestMatch);
        localResult.llm.scores = evalResult.scores;
        localResult.llm.characterEmotion = evalResult.characterEmotion;
        localResult.llm.mascotFeedback = evalResult.mascotFeedback;
      }
      return localResult;
    }
  } catch (err) {
    console.log("ℹ️ [Ontology Service]: Python FastAPI server offline or timing out, using in-browser rule engine fallback.");
  }
  
  return window.runFullPipeline(scenarioId, userText);
};
