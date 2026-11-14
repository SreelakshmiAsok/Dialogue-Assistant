// ============================================================
// API CLIENT ΓÇö Connects to Flask backend via Next.js proxy
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
  social_story_tamil?: string;
  question_tanglish: string;
  question_tamil: string;
  difficulty: number;
}

export interface EvaluationResult {
  correct: boolean;
  stars: number;
  feedback: string;
  feedback_tamil?: string;
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
  streak_days?: number;
  daily?: { day: string; date: string; stars: number }[];
  last_activity?: string | null;
}

export interface HistoryExchange {
  question: string;
  answer: string;
  correct: boolean;
  at: string;
}

export interface HistorySession {
  id: string;
  character: string;
  tier: number;
  started_at: string;
  ended_at: string;
  exchanges: HistoryExchange[];
  starsEarned: number;
  questionsAttempted: number;
  correctAnswers: number;
  status: "completed" | "attempted";
}

export interface ChildSummary {
  id: string;
  email: string;
  name: string;
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
  scenario_tamil?: string;
  initial_prompt: { tanglish: string; tamil: string; english: string };
  turns: any[];
  completion: any;
}

export interface Tier2EvaluationResult {
  correct: boolean;
  stars_awarded: number;
  feedback: string;
  feedback_tamil?: string;
  final_appreciation_tamil?: string;
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

export const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
  : "/api";
import { getAuthHeaders, getParentToken, getToken } from "./auth";

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const res = await fetch(`${API_BASE}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ question_id: questionId, response }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Failed to evaluate answer");
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function getAudioUrl(questionId: string): string {
  return `${API_BASE}/audio/${questionId}`;
}

export function getTtsAudioUrl(text: string, character: string): string {
  return `${API_BASE}/tts?text=${encodeURIComponent(text)}&character=${encodeURIComponent(character)}`;
}

// ---- Parent dashboard data (per child, stored on the server / MongoDB) ----
function dashboardHeaders(): Record<string, string> {
  const token = getParentToken() || getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const SELECTED_CHILD_KEY = "dashboard_child_id";

export function getSelectedChildId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem(SELECTED_CHILD_KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function setSelectedChildId(id: string): void {
  try {
    localStorage.setItem(SELECTED_CHILD_KEY, id);
    window.dispatchEvent(new Event("dashboard-child-changed"));
  } catch {
    /* ignore */
  }
}

export async function fetchChildren(): Promise<ChildSummary[]> {
  const res = await fetch(`${API_BASE}/parents/children`, { headers: dashboardHeaders() });
  if (!res.ok) throw new Error("Failed to fetch children");
  const data = await res.json();
  return data.children || [];
}

export async function fetchProgress(studentId?: string): Promise<ProgressData> {
  const id = studentId || getSelectedChildId();
  const url = id ? `${API_BASE}/progress?student_id=${encodeURIComponent(id)}` : `${API_BASE}/progress`;
  const res = await fetch(url, { headers: dashboardHeaders() });
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

export async function fetchHistory(studentId?: string): Promise<HistorySession[]> {
  const id = studentId || getSelectedChildId();
  const url = id ? `${API_BASE}/history?student_id=${encodeURIComponent(id)}` : `${API_BASE}/history`;
  const res = await fetch(url, { headers: dashboardHeaders() });
  if (!res.ok) throw new Error("Failed to fetch history");
  const data = await res.json();
  return data.sessions || [];
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
