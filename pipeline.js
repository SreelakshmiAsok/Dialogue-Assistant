// pipeline.js - Simulates Whisper, RAG vector lookup, Ontology checks, and LLM evaluation


// Helper: Tokenize, clean, and convert text to bag of words
function getBagOfWords(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2) // Filter short filler words
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
    if (item.intent === "perfect_safety_refusal" && (inputWords.has("no") || inputWords.has("dont") || inputWords.has("cant")) && (inputWords.has("mom") || inputWords.has("dad") || inputWords.has("parents"))) {
      baseSim = Math.max(baseSim, 0.95);
    }
    if (item.intent === "dangerous_acceptance" && (inputWords.has("sure") || inputWords.has("okay") || inputWords.has("yes") || inputWords.has("go") || inputWords.has("puppy") || inputWords.has("chocolate"))) {
      baseSim = Math.max(baseSim, 0.88);
    }
    if (item.intent === "honest_apology_reconcile" && (inputWords.has("sorry") || inputWords.has("accident")) && (inputWords.has("fix") || inputWords.has("help"))) {
      baseSim = Math.max(baseSim, 0.94);
    }
    if (item.intent === "propose_timer_turn" && (inputWords.has("turn") || inputWords.has("share") || inputWords.has("timer") || inputWords.has("minutes"))) {
      baseSim = Math.max(baseSim, 0.93);
    }
    if (item.intent === "polite_request" && (inputWords.has("please") || inputWords.has("excuse")) && (inputWords.has("bathroom") || inputWords.has("restroom") || inputWords.has("toilet"))) {
      baseSim = Math.max(baseSim, 0.96);
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
        if (cleanedInput.toLowerCase().includes(negKw.toLowerCase())) {
          status = "VIOLATION";
          triggeredKeywords.push(negKw);
          details = `Violation triggered: Used forbidden phrase/concept "${negKw}".`;
        }
      }
    }

    // If no violations, check Positive Keywords (Required terms)
    if (status !== "VIOLATION" && rule.keywords) {
      const hasPosKw = rule.keywords.some(posKw => {
        const matches = cleanedInput.toLowerCase().includes(posKw.toLowerCase());
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

  // ==========================================
  // STAGE 4: LLM Evaluation and Feedback Generation
  // ==========================================
  // Default values
  let politeScore = 8;
  let safetyScore = 10;
  let relevanceScore = 9;
  let characterEmotion = "neutral";
  let mascotFeedback = "";

  // Adjust scores based on ontology results
  if (scenarioId === "teacher") {
    const politeCheck = ruleEvaluations.find(r => r.id === "T_POLITE");
    const decorumCheck = ruleEvaluations.find(r => r.id === "T_DECORUM");
    
    if (politeCheck?.status === "PASS") politeScore = 10;
    else politeScore = 5;

    if (decorumCheck?.status === "VIOLATION") politeScore = Math.max(2, politeScore - 4);
  } else if (scenarioId === "parent") {
    const apologyCheck = ruleEvaluations.find(r => r.id === "P_APOLOGY");
    if (apologyCheck?.status === "PASS") politeScore = 10;
    else politeScore = 6;
  } else if (scenarioId === "friend") {
    const cooperateCheck = ruleEvaluations.find(r => r.id === "F_COOPERATE" || r.id === "F_TURN");
    if (cooperateCheck?.status === "PASS") politeScore = 10;
    else if (cooperateCheck?.status === "VIOLATION") politeScore = 2;
    else politeScore = 6;
  }

  // Safety (Crucial for Stranger Scenario)
  if (scenarioId === "stranger") {
    const refusalCheck = ruleEvaluations.find(r => r.id === "S_REFUSAL");
    const adultCheck = ruleEvaluations.find(r => r.id === "S_ADULT");
    const distanceCheck = ruleEvaluations.find(r => r.id === "S_DISTANCE");

    if (refusalCheck?.status === "VIOLATION" || distanceCheck?.status === "VIOLATION") {
      safetyScore = 1;
    } else if (refusalCheck?.status === "PASS") {
      safetyScore = 10;
    } else {
      safetyScore = 3;
    }
  }

  // Relevance based on best matching RAG score
  relevanceScore = Math.max(1, Math.round(bestMatch.similarity * 10));

  // Determine final cartoon character emotion & mascot review text
  if (scenarioId === "stranger") {
    if (safetyScore >= 9) {
      characterEmotion = "concerned"; // The stranger is annoyed/thwarted!
      mascotFeedback = "Sensational safety check! You said NO and told him you would check with your Mom. Strangers should never ask children for help or offer them things without their parents knowing. Keep up the excellent work!";
    } else if (safetyScore >= 6) {
      characterEmotion = "neutral";
      mascotFeedback = "Good job saying NO. To make your answer even safer, remember to say that you need to check with your parents, or immediately run to a trusted adult!";
    } else {
      characterEmotion = "happy"; // The stranger smiles because the child fell for the trap!
      mascotFeedback = "Stop! That is very dangerous. Never, ever go with a stranger or accept treats from them, even if they have a cute puppy or delicious candy. Say NO loudly, stay back, and go find a parent or teacher right away.";
    }
  } else {
    // Normal scenarios (Teacher, Parent, Friend)
    if (bestMatch.similarity > 0.6) {
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
      scores: {
        politeness: politeScore,
        safety: safetyScore,
        relevance: relevanceScore,
        overall: starRating
      },
      characterEmotion: characterEmotion,
      mascotFeedback: mascotFeedback
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
      localResult.ontology.pythonRules = liveOntologyData.ontology.rules;
      return localResult;
    }
  } catch (err) {
    console.log("ℹ️ [Ontology Service]: Python FastAPI server offline or timing out, using in-browser rule engine fallback.");
  }
  
  return window.runFullPipeline(scenarioId, userText);
};

