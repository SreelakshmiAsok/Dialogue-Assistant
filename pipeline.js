// pipeline.js - Whisper STT simulation, RAG vector search, Linguistic Gate, Ontology + Python FastAPI reasoning backend

// ─────────────────────────────────────────────
// Utility: Tokenize text to bag of words
// ─────────────────────────────────────────────
function getBagOfWords(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 1)
  );
}

// Cosine similarity between two word sets (binary bag-of-words)
function calculateCosineSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const word of setA) { if (setB.has(word)) intersectionCount++; }
  return intersectionCount / Math.sqrt(setA.size * setB.size);
}

// ─────────────────────────────────────────────
// LINGUISTIC GATE
// Models constraints from TamilMixSentiment, DravidianLangTech, AI4Bharat IndicCorp V2
// ─────────────────────────────────────────────
const SLANG_PARTICLES   = ["da", "di", "டா", "டி"];
const DISRESPECT_WORDS  = ["poda", "vada", "போடா", "வடா", "podaa", "vadaa"];
const BLUNT_VERBS       = ["va", "po", "வா", "போ"];
const HONORIFIC_SUFFIXES= ["vaanga", "ponga", "வாங்க", "போங்க"];
const HONORIFIC_MARKERS = ["nga", "neenga", "sir", "madam", "anna", "akka", "ங்க", "நீங்க", "சார்", "மேடம்", "அண்ணா", "அக்கா"];
const FRIEND_PEER_ID    = "friend";

/**
 * Checks user text for Tamil/Tanglish linguistic politeness constraints.
 * Returns: { verdict: "PASS" | "FAIL" | "WARNING", failType: string|null, suggestion: string|null }
 */
function checkLinguisticConstraints(scenarioId, rawText) {
  const text = rawText.toLowerCase().trim();

  // ── PEER RELAXATION: Friend context bypasses all filters ──────────────────
  if (scenarioId === FRIEND_PEER_ID) {
    return { verdict: "PASS", failType: null, suggestion: null };
  }

  // ── DISRESPECT SHIELD: Catch outright disrespectful words first ───────────
  for (const word of DISRESPECT_WORDS) {
    const lw = word.toLowerCase();
    const regex = new RegExp(`(^|\\s|[^a-zа-я])${lw}($|\\s|[^a-zа-я])`, "i");
    if (regex.test(text) || text.includes(lw)) {
      return {
        verdict: "FAIL",
        failType: "DISRESPECT",
        triggeredWord: word,
        suggestion: `💡 "${word}" is a rude word to use with ${getCharacterTitle(scenarioId)}. Instead, be kind and polite!`
      };
    }
  }

  // ── SLANG PARTICLE CHECK: Informal "da/di" with elder/stranger ────────────
  for (const particle of SLANG_PARTICLES) {
    const lp = particle.toLowerCase();
    const regex = new RegExp(`(^|\\s)${lp}($|\\s|[!?.,])`, "i");
    if (regex.test(text + " ")) {
      return {
        verdict: "FAIL",
        failType: "SLANG",
        triggeredWord: particle,
        suggestion: `💡 Saying "${particle}" is too casual with ${getCharacterTitle(scenarioId)}. Remove it or use respectful words like "Sir", "Madam", or "nga" to show respect!`
      };
    }
  }

  // ── BLUNT VERB GATE: Imperative verbs without honorific upgrade ────────────
  for (const verb of BLUNT_VERBS) {
    const lv = verb.toLowerCase();
    const verbRegex = new RegExp(`(^|\\s)${lv}($|\\s|[!?.,])`, "i");
    if (verbRegex.test(text + " ")) {
      const hasHonorific = HONORIFIC_SUFFIXES.some(h => text.includes(h.toLowerCase()));
      if (!hasHonorific) {
        return {
          verdict: "FAIL",
          failType: "BLUNT_VERB",
          triggeredWord: verb,
          suggestion: `💡 Instead of saying "${verb}", say "${verb === "va" || verb === "வா" ? "vaanga / வாங்க" : "ponga / போங்க"}" to speak politely to ${getCharacterTitle(scenarioId)}!`
        };
      }
    }
  }

  // ── HONORIFIC CHECK: Soft warning if speaking to adult without markers ────
  const hasAnyHonorific = [
    ...HONORIFIC_SUFFIXES,
    ...HONORIFIC_MARKERS,
    "please", "excuse me", "may i", "could you", "thank you",
    "sorry", "mannichuko", "mannippu"
  ].some(h => text.includes(h.toLowerCase()));

  if (!hasAnyHonorific) {
    return {
      verdict: "WARNING",
      failType: "MISSING_HONORIFIC",
      triggeredWord: null,
      suggestion: `💡 Try adding a polite word like "please", "Sir", "nga", or "vaanga" to show respect to ${getCharacterTitle(scenarioId)}!`
    };
  }

  return { verdict: "PASS", failType: null, suggestion: null };
}

function getCharacterTitle(scenarioId) {
  const titles = { teacher: "your Teacher", parent: "Dad", stranger: "a Stranger" };
  return titles[scenarioId] || "this person";
}

// ─────────────────────────────────────────────
// MAIN PIPELINE SYNCHRONOUS FALLBACK
// ─────────────────────────────────────────────
window.runFullPipeline = function(scenarioId, userText) {
  const scenario = window.scenarios[scenarioId];
  if (!scenario) throw new Error(`Scenario ${scenarioId} not found`);

  const cleanedInput = userText.trim();
  const inputWords   = getBagOfWords(cleanedInput);

  // ── STAGE 0: Linguistic Gate (Tamil/Tanglish pragmatics) ──────────────────
  const linguisticResult = checkLinguisticConstraints(scenarioId, cleanedInput);

  // ── STAGE 1: Whisper STT Confidence simulation ────────────────────────────
  const whisperConfidence = cleanedInput.length > 0
    ? Math.min(0.99, Number((0.90 + Math.random() * 0.09).toFixed(3))) : 0;

  // ── STAGE 2: RAG Vector Similarity Search ────────────────────────────────
  const ragResults = scenario.ragDatabase.map(item => {
    const refWords = getBagOfWords(item.utterance);
    let baseSim    = calculateCosineSimilarity(inputWords, refWords);
    let overlapCount = 0;
    refWords.forEach(w => { if (inputWords.has(w)) overlapCount++; });

    // Semantic trigger boosts
    if (item.intent === "perfect_safety_refusal" &&
        (inputWords.has("no") || inputWords.has("dont") || inputWords.has("cant") ||
         inputWords.has("vendam") || inputWords.has("வேண்டாம்")) &&
        (inputWords.has("mom") || inputWords.has("dad") || inputWords.has("amma") || inputWords.has("appa"))) {
      baseSim = Math.max(baseSim, 0.95);
    }
    if (item.intent === "tanglish_safety_refusal" &&
        (inputWords.has("vendam") || inputWords.has("வேண்டாம்")) &&
        (inputWords.has("amma") || inputWords.has("appa"))) {
      baseSim = Math.max(baseSim, 0.97);
    }
    if (item.intent === "dangerous_acceptance" &&
        (inputWords.has("sure") || inputWords.has("okay") || inputWords.has("yes") ||
         inputWords.has("kitten") || inputWords.has("cookies") || inputWords.has("cookie") || inputWords.has("climb"))) {
      baseSim = Math.max(baseSim, 0.88);
    }
    if (item.intent === "honest_apology_reconcile" &&
        (inputWords.has("sorry") || inputWords.has("accident") || inputWords.has("mannichuko")) &&
        (inputWords.has("fix") || inputWords.has("help") || inputWords.has("pannalama"))) {
      baseSim = Math.max(baseSim, 0.94);
    }
    if (item.intent === "propose_timer_turn" &&
        (inputWords.has("turn") || inputWords.has("share") || inputWords.has("timer") ||
         inputWords.has("maari") || inputWords.has("aadalaama"))) {
      baseSim = Math.max(baseSim, 0.93);
    }
    if (item.intent === "polite_request" &&
        (inputWords.has("please") || inputWords.has("excuse") || inputWords.has("vaanga")) &&
        (inputWords.has("bathroom") || inputWords.has("restroom") || inputWords.has("toilet") || inputWords.has("poganum"))) {
      baseSim = Math.max(baseSim, 0.96);
    }

    const finalSimilarity = baseSim > 0.05
      ? Math.min(0.99, Number((baseSim + overlapCount * 0.02).toFixed(3)))
      : Number((Math.random() * 0.15).toFixed(3));

    return { utterance: item.utterance, intent: item.intent, similarity: finalSimilarity, evaluation: item.evaluation };
  });

  ragResults.sort((a, b) => b.similarity - a.similarity);
  const bestMatch = ragResults[0];

  // ── STAGE 3: Ontology Verification ────────────────────────────────────────
  const ontologyRules  = scenario.ontology.rules;
  const ruleEvaluations = ontologyRules.map(rule => {
    let status = "PASS";
    let details = "Rule criteria met successfully.";
    let triggeredKeywords = [];

    if (rule.negativeKeywords) {
      for (const negKw of rule.negativeKeywords) {
        if (cleanedInput.toLowerCase().includes(negKw.toLowerCase())) {
          status = "VIOLATION"; triggeredKeywords.push(negKw);
          details = `Violation triggered: Used forbidden phrase/concept "${negKw}".`;
        }
      }
    }
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

    return { id: rule.id, name: rule.name, description: rule.description, status, details, triggeredKeywords, severity: rule.severity };
  });

  const ruleViolations = ruleEvaluations.filter(r => r.status === "VIOLATION");
  const ruleFailures   = ruleEvaluations.filter(r => r.status === "FAIL");

  // ── STAGE 4: LLM Score Evaluation ─────────────────────────────────────────
  let politeScore    = 8;
  let safetyScore    = 10;
  let relevanceScore = 9;
  let characterEmotion = "neutral";
  let mascotFeedback   = "";
  let linguisticBlock  = null;

  if (linguisticResult.verdict === "FAIL") {
    linguisticBlock = linguisticResult;
    politeScore  = 2;
    characterEmotion = "concerned";
    if (linguisticResult.failType === "DISRESPECT") {
      mascotFeedback = `⚠️ Oops! The word "${linguisticResult.triggeredWord}" is disrespectful to use with ${getCharacterTitle(scenarioId)}. ${linguisticResult.suggestion}`;
    } else if (linguisticResult.failType === "SLANG") {
      mascotFeedback = `⚠️ That sounds too casual! ${linguisticResult.suggestion}`;
    } else if (linguisticResult.failType === "BLUNT_VERB") {
      mascotFeedback = `⚠️ That sounds too blunt! ${linguisticResult.suggestion}`;
    }
  } else if (linguisticResult.verdict === "WARNING") {
    linguisticBlock = linguisticResult;
    politeScore = Math.min(politeScore, 6);
  }

  if (linguisticResult.verdict !== "FAIL") {
    if (scenarioId === "teacher") {
      const politeCheck = ruleEvaluations.find(r => r.id === "T_POLITE");
      if (politeCheck?.status === "PASS") politeScore = linguisticResult.verdict === "WARNING" ? 7 : 10;
      else politeScore = 5;
    } else if (scenarioId === "parent") {
      const apologyCheck = ruleEvaluations.find(r => r.id === "P_APOLOGY");
      if (apologyCheck?.status === "PASS") politeScore = linguisticResult.verdict === "WARNING" ? 7 : 10;
      else politeScore = 6;
    } else if (scenarioId === "friend") {
      const cooperateCheck = ruleEvaluations.find(r => r.id === "F_COOPERATE" || r.id === "F_TURN");
      if (cooperateCheck?.status === "PASS") politeScore = 10;
      else if (cooperateCheck?.status === "VIOLATION") politeScore = 2;
      else politeScore = 6;
    }

    if (scenarioId === "stranger") {
      const refusalCheck  = ruleEvaluations.find(r => r.id === "S_REFUSAL");
      const adultCheck    = ruleEvaluations.find(r => r.id === "S_ADULT");
      const distanceCheck = ruleEvaluations.find(r => r.id === "S_DISTANCE");
      if (refusalCheck?.status === "VIOLATION" || distanceCheck?.status === "VIOLATION") { safetyScore = 1; }
      else if (refusalCheck?.status === "PASS" && adultCheck?.status === "PASS")         { safetyScore = 10; }
      else if (refusalCheck?.status === "PASS")                                          { safetyScore = 7; }
      else                                                                               { safetyScore = 3; }
    }
  }

  relevanceScore = Math.max(1, Math.round(bestMatch.similarity * 10));

  if (!mascotFeedback) {
    if (scenarioId === "stranger") {
      if (safetyScore >= 9)      { characterEmotion = "concerned"; mascotFeedback = "Sensational safety check! You said NO and told her you would check with your Mom. Strangers should never ask children for help or offer them things without their parents knowing. Keep up the excellent work!"; }
      else if (safetyScore >= 6) { characterEmotion = "neutral";   mascotFeedback = "Good job saying NO. To make your answer even safer, remember to say that you need to check with your parents, or immediately run to a trusted adult!"; }
      else                        { characterEmotion = "happy";    mascotFeedback = "Stop! That is very dangerous. Never, ever go with a stranger or accept treats from them, even if they have a cute kitten or delicious cookies. Say NO loudly, stay back, and go find a parent or teacher right away."; }
    } else {
      if (bestMatch.similarity > 0.55) {
        characterEmotion = bestMatch.evaluation.emotion;
        mascotFeedback   = bestMatch.evaluation.feedback;
      } else {
        characterEmotion = "concerned";
        if (scenarioId === "teacher") mascotFeedback = "Hmm, Ms. Apple asked if anyone needs to go to the restroom before the spelling test. Let's try asking politely to use the restroom, or say 'No thank you, I am ready!'";
        else if (scenarioId === "parent") mascotFeedback = "Dad wants to know what happened to the robot toy. Let's try being honest and telling him you accidentally dropped it and are sorry.";
        else if (scenarioId === "friend") mascotFeedback = "Leo is waiting on the swing! Try asking to share the swing, set a timer, or suggest playing a different game together.";
      }
    }
  }

  if (linguisticResult.verdict === "WARNING" && linguisticResult.suggestion) {
    mascotFeedback += "\n\n" + linguisticResult.suggestion;
  }

  const compositeScore = (politeScore + safetyScore + relevanceScore) / 3;
  let starRating = 3;
  if (compositeScore >= 9.0)      starRating = 5;
  else if (compositeScore >= 7.5) starRating = 4;
  else if (compositeScore >= 5.0) starRating = 3;
  else if (compositeScore >= 3.0) starRating = 2;
  else                            starRating = 1;

  const result = {
    whisper:  { confidence: whisperConfidence, text: cleanedInput },
    rag:      { query: cleanedInput, matches: ragResults.slice(0, 3) },
    ontology: { ontologyDescription: scenario.ontology.description, rules: ruleEvaluations, hasViolations: ruleViolations.length > 0, hasFailures: ruleFailures.length > 0 },
    linguistic: linguisticResult,
    llm: {
      scores:          { politeness: politeScore, safety: safetyScore, relevance: relevanceScore, overall: starRating },
      characterEmotion: characterEmotion,
      mascotFeedback:   mascotFeedback,
      linguisticBlock:  linguisticBlock
    }
  };

  if (window.progressData) {
    window.progressData.addSession(scenarioId, result.llm.scores, cleanedInput);
  }

  return result;
};

// ─────────────────────────────────────────────
// ASYNCHRONOUS PIPELINE WITH PYTHON FASTAPI BACKEND
// ─────────────────────────────────────────────
window.runFullPipelineAsync = async function(scenarioId, userText) {
  // Always evaluate locally first
  const localResult = window.runFullPipeline(scenarioId, userText);

  // Try connecting to Python FastAPI OWL Reasoning Server
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
    
    const response = await fetch("http://localhost:8000/reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: scenarioId, userText: userText }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const liveOntologyData = await response.json();
      console.log("⚡ [FastAPI OWL Ontology Reasoner Response]:", liveOntologyData);
      
      localResult.ontology.pythonBackendActive = true;
      localResult.ontology.owlFile = liveOntologyData.ontology.ontology_file;
      localResult.ontology.pythonRules = liveOntologyData.ontology.rules;
      if (liveOntologyData.suggested_feedback) {
        localResult.ontology.suggestedFeedback = liveOntologyData.suggested_feedback;
      }
      return localResult;
    }
  } catch (err) {
    console.log("ℹ️ [Ontology Service]: Python FastAPI server offline, using in-browser rule engine.");
    localResult.ontology.pythonBackendActive = false;
  }
  
  return localResult;
};
