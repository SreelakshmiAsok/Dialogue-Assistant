"use client";

import { useState } from "react";
import { useEffect } from "react";
import { CHARACTERS } from "@/lib/characters";
import { fetchHistory } from "@/lib/api";
import type { HistorySession } from "@/lib/api";

interface SessionEntry {
  id: string;
  character: string;
  date: string;
  time: string;
  questionsAttempted: number;
  correctAnswers: number;
  starsEarned: number;
  status: "completed" | "attempted";
  exchanges: { question: string; answer: string; correct: boolean }[];
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function toEntry(s: HistorySession): SessionEntry {
  return {
    id: s.id,
    character: s.character,
    date: dateLabel(s.ended_at),
    time: timeLabel(s.ended_at),
    questionsAttempted: s.questionsAttempted,
    correctAnswers: s.correctAnswers,
    starsEarned: s.starsEarned,
    status: s.status,
    exchanges: s.exchanges.map((e) => ({ question: e.question, answer: e.answer, correct: e.correct })),
  };
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionEntry | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "attempted">("all");

  useEffect(() => {
    const load = () => {
      fetchHistory()
        .then((data) => {
          const entries = data.map(toEntry);
          setSessions(entries);
          setSelectedSession((prev) => entries.find((e) => e.id === prev?.id) || entries[0] || null);
        })
        .catch(() => setSessions([]))
        .finally(() => setLoading(false));
    };
    load();
    // Reload when the parent switches to another child
    window.addEventListener("dashboard-child-changed", load);
    return () => window.removeEventListener("dashboard-child-changed", load);
  }, []);

  const filteredSessions = sessions.filter(
    (s) => filter === "all" || s.status === filter
  );

  const getCharMeta = (name: string) => CHARACTERS.find((c) => c.backendName === name);

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <h1 className="text-[28px] md:text-[36px] font-bold text-on-surface mb-2">Session History</h1>
      <p className="text-[16px] text-on-surface-variant mb-6">Review past practice sessions and dialogue exchanges.</p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Session List */}
        <div className="md:w-[320px] shrink-0">
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {(["all", "completed", "attempted"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {f === "all" ? "All Dates" : f}
              </button>
            ))}
          </div>

          {/* Session cards */}
          {!loading && sessions.length === 0 && (
            <div className="text-center py-10 px-4 bg-surface-container-low rounded-2xl">
              <span className="material-symbols-outlined text-[40px] text-outline-variant mb-2">history</span>
              <p className="text-[15px] text-on-surface-variant">No practice sessions yet. Answers will appear here as your child practises.</p>
            </div>
          )}
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const charMeta = getCharMeta(session.character);
              const isSelected = selectedSession?.id === session.id;
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left rounded-2xl p-4 transition-all ${
                    isSelected
                      ? "bg-surface-container ring-2 ring-primary shadow-sm"
                      : "bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className={`text-[16px] font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                      {charMeta?.displayName || session.character} Practice
                    </p>
                    <span className="text-[13px] text-on-surface-variant">{session.date}, {session.time}</span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant mb-2">
                    {session.correctAnswers}/{session.questionsAttempted} correct • {session.starsEarned} stars
                  </p>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    session.status === "completed"
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-tertiary-container text-on-tertiary-container"
                  }`}>
                    {session.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Session Detail */}
        {selectedSession && (
          <div className="flex-1">
            <div className="bg-surface-container rounded-3xl p-6 md:p-8">
              {/* Session Header */}
              <div className="flex items-center gap-4 mb-6">
                {getCharMeta(selectedSession.character) && (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container">
                    <img
                      src={getCharMeta(selectedSession.character)!.imagePath}
                      alt={selectedSession.character}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-[22px] font-bold text-on-surface">
                    {getCharMeta(selectedSession.character)?.displayName || selectedSession.character} Session
                  </h2>
                  <p className="text-[14px] text-on-surface-variant">
                    {selectedSession.date} • {selectedSession.questionsAttempted} questions • {selectedSession.starsEarned} ⭐
                  </p>
                </div>
              </div>

              {/* Dialogue Exchanges */}
              <div className="space-y-4">
                {selectedSession.exchanges.map((ex, i) => (
                  <div key={i}>
                    {/* Question (character) */}
                    <div className="flex gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 mt-1">
                        <span className="material-symbols-outlined text-[16px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                      </div>
                      <div className="bg-surface-container-low rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                        <p className="text-[15px] text-on-surface leading-[22px]">{ex.question}</p>
                      </div>
                    </div>
                    {/* Answer (child) */}
                    <div className="flex gap-3 justify-end">
                      <div className={`rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] ${
                        ex.correct ? "bg-primary-container" : "bg-error-container"
                      }`}>
                        <p className={`text-[15px] leading-[22px] ${
                          ex.correct ? "text-on-primary-container" : "text-on-error-container"
                        }`}>
                          {ex.answer}
                        </p>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                        ex.correct ? "bg-secondary-container" : "bg-error-container"
                      }`}>
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {ex.correct ? "sentiment_satisfied" : "sentiment_dissatisfied"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Analysis */}
            <div className="bg-surface-container rounded-3xl p-6 mt-4">
              <h3 className="text-[18px] font-bold text-on-surface mb-4">Session Analysis</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-2xl p-4">
                  <p className="text-[13px] font-semibold text-on-surface-variant mb-1">Accuracy</p>
                  <p className="text-[24px] font-bold text-on-surface">
                    {Math.round((selectedSession.correctAnswers / selectedSession.questionsAttempted) * 100)}%
                  </p>
                </div>
                <div className="bg-surface-container-low rounded-2xl p-4">
                  <p className="text-[13px] font-semibold text-on-surface-variant mb-1">Stars Earned</p>
                  <p className="text-[24px] font-bold text-primary">{selectedSession.starsEarned} ⭐</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
