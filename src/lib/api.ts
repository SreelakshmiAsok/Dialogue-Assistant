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

export interface Tier2LessonSummary {
  id: string;
  character: string;
  skill: string;
  learning_objective: string;
  difficulty: number;
  initial_prompt?: { tanglish: string; tamil: string; english: string };
}

export interface Tier2Lesson {
  id: string;
  character: string;
  tier: number;
  difficulty: number;
  skill: string;
  learning_objective: string;
  scenario: string;
  initial_prompt: { tanglish: string; tamil: string; english: string };
  turns: any[];
  completion: any;
}

export interface Tier2EvaluationResult {
  correct: boolean;
  stars_awarded: number;
  feedback: string;
  suggestion: string | null;
  next_character_reply: { tanglish: string; tamil: string; english?: string } | null;
  next_turn_id: string | null;
  is_completed: boolean;
  scores: {
    politeness: number;
    safety: number;
    relevance: number;
  };
  transcribed_text: string;
  transcribed_tamil: string;
}

const API_BASE = "http://127.0.0.1:5001/api";
import { getAuthHeaders, getRole } from "./auth";

export async function fetchCharacters(): Promise<Character[]> {
  const res = await fetch(`${API_BASE}/characters`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch characters");
  const data = await res.json();
  return data.characters;
}

export async function fetchQuestions(character: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/questions/${character}`, { headers: getAuthHeaders() });
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
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ question_id: questionId, response }),
  });
  if (!res.ok) throw new Error("Failed to evaluate answer");
  return res.json();
}

export function getAudioUrl(questionId: string): string {
  return `${API_BASE}/audio/${questionId}`;
}

export async function fetchProgress(studentId?: string): Promise<ProgressData> {
  const role = getRole();
  const url = role === "parent" && studentId 
    ? `${API_BASE}/progress?student_id=${studentId}` 
    : `${API_BASE}/progress`;
    
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

export async function fetchTier2Lessons(character: string): Promise<Tier2LessonSummary[]> {
  const res = await fetch(`${API_BASE}/tier2/lessons/${character}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch tier 2 lessons");
  const data = await res.json();
  return data.lessons;
}

export async function fetchTier2Lesson(lessonId: string): Promise<Tier2Lesson> {
  const res = await fetch(`${API_BASE}/tier2/lesson/${lessonId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch tier 2 lesson");
  const data = await res.json();
  return data.lesson;
}

export async function evaluateTier2Turn(
  lessonId: string,
  turnId: string,
  response: string,
  retryCount: number
): Promise<Tier2EvaluationResult> {
  const res = await fetch(`${API_BASE}/tier2/evaluate-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ lesson_id: lessonId, turn_id: turnId, response, retry_count: retryCount }),
  });
  if (!res.ok) throw new Error("Failed to evaluate tier 2 turn");
  return res.json();
}