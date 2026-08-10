// ============================================================
// API CLIENT — Connects to Flask backend via Next.js proxy
// ============================================================

export interface Character {
  name: string;
  avatar: string;
  total_questions: number;
  description: string;
}

export interface Question {
  id: string;
  character: string;
  avatar: string;
  lesson: string;
  social_story: string;
  question_tanglish: string;
  question_tamil: string;
  difficulty: number;
}

export interface EvaluationResult {
  correct: boolean;
  stars: number;
  feedback: string;
  suggestion: string | null;
  model_answer: string;
  encouragement: string;
  transcribed_text: string;
  transcribed_tamil?: string;
  semantic_score: number;
  sentiment: string;
}

export interface ProgressData {
  total_attempts: number;
  correct_attempts: number;
  total_stars: number;
  accuracy: number;
}

const API_BASE = "/api";

export async function fetchCharacters(): Promise<Character[]> {
  const res = await fetch(`${API_BASE}/characters`);
  if (!res.ok) throw new Error("Failed to fetch characters");
  const data = await res.json();
  return data.characters;
}

export async function fetchQuestions(character: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/questions/${character}`);
  if (!res.ok) throw new Error("Failed to fetch questions");
  const data = await res.json();
  return data.questions;
}

export async function evaluateAnswer(
  questionId: string,
  response: string
): Promise<EvaluationResult> {
  const res = await fetch(`${API_BASE}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_id: questionId, response }),
  });
  if (!res.ok) throw new Error("Failed to evaluate answer");
  return res.json();
}

export function getAudioUrl(questionId: string): string {
  return `${API_BASE}/audio/${questionId}`;
}

export async function fetchProgress(): Promise<ProgressData> {
  const res = await fetch(`${API_BASE}/progress`);
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}
