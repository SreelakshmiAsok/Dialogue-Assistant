"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchProgress } from "@/lib/api";
import type { ProgressData } from "@/lib/api";

export default function DashboardOverview() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress()
      .then((data) => {
        setProgress(data);
        setLoading(false);
      })
      .catch(() => {
        setProgress({
          total_attempts: 0,
          correct_attempts: 0,
          total_stars: 0,
          accuracy: 0,
        });
        setLoading(false);
      });
  }, []);

  // Simulated weekly data for the bar chart
  const weeklyData = [
    { day: "Mon", value: 35 },
    { day: "Tue", value: 50 },
    { day: "Wed", value: 40 },
    { day: "Thu", value: 55 },
    { day: "Fri", value: 70 },
    { day: "Sat", value: 85 },
    { day: "Sun", value: 95 },
  ];
  const maxVal = Math.max(...weeklyData.map((d) => d.value), 1);

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <h1 className="text-[28px] md:text-[36px] font-bold text-on-surface mb-2">Overview</h1>
      <p className="text-[16px] text-on-surface-variant mb-8">
        Welcome back. Here is the latest progress summary.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Stars */}
            <div className="bg-surface-container rounded-3xl p-6 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-[36px] text-primary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <p className="text-[14px] font-semibold text-on-surface-variant mb-1">Total Stars</p>
              <p className="text-[40px] font-bold text-on-surface leading-tight">{progress?.total_stars || 0}</p>
            </div>

            {/* Accuracy */}
            <div className="bg-surface-container rounded-3xl p-6 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-[36px] text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>target</span>
              <p className="text-[14px] font-semibold text-on-surface-variant mb-1">Accuracy</p>
              <p className="text-[40px] font-bold text-on-surface leading-tight">{progress?.accuracy || 0}<span className="text-[20px] text-on-surface-variant">%</span></p>
            </div>

            {/* Total Sessions */}
            <div className="bg-surface-container rounded-3xl p-6 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-[36px] text-tertiary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <p className="text-[14px] font-semibold text-on-surface-variant mb-1">Questions Attempted</p>
              <p className="text-[40px] font-bold text-on-surface leading-tight">{progress?.total_attempts || 0}</p>
              <p className="text-[13px] text-on-surface-variant mt-1">{progress?.correct_attempts || 0} correct</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="md:col-span-3 bg-surface-container rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[20px] font-bold text-on-surface">Recent Activity</h2>
                <button
                  onClick={() => router.push("/dashboard/history")}
                  className="text-[14px] font-bold text-primary hover:underline"
                >
                  View All
                </button>
              </div>

              {(progress?.total_attempts ?? 0) > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-surface-container-low rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] text-on-secondary-container">chat</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-on-surface">Social Skills Practice</p>
                      <p className="text-[13px] text-on-surface-variant">
                        {progress?.correct_attempts} correct • {progress?.total_stars} stars earned
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-on-surface">Today</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">spa</span>
                  <p className="text-[15px] text-on-surface-variant">No sessions yet! Start a practice session to see activity here.</p>
                </div>
              )}
            </div>

            {/* Current Streak */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-surface-container rounded-3xl p-6 text-center">
                <span className="material-symbols-outlined text-[32px] text-primary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <p className="text-[14px] font-semibold text-on-surface-variant mb-1">Current Streak</p>
                <p className="text-[40px] font-bold text-on-surface leading-tight">
                  {(progress?.total_attempts ?? 0) > 0 ? "1" : "0"} <span className="text-[18px] text-on-surface-variant">Days</span>
                </p>
                <div className="flex gap-1.5 justify-center mt-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i === 0 && (progress?.total_attempts ?? 0) > 0 ? 'bg-primary' : 'bg-surface-container-high'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-surface-container rounded-3xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-[20px] font-bold text-on-surface">Progress Overview</h2>
                <p className="text-[14px] text-on-surface-variant">Engagement score over the week</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-surface-container-high text-on-surface-variant">Week</button>
                <button className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-primary text-on-primary">Month</button>
              </div>
            </div>

            <div className="flex items-end gap-3 mt-6 h-[180px]">
              {weeklyData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-xl transition-all duration-500"
                    style={{
                      height: `${(d.value / maxVal) * 150}px`,
                      backgroundColor: d.day === "Sun" ? "var(--color-primary)" : "var(--color-secondary-container)",
                    }}
                  />
                  <span className="text-[12px] font-semibold text-on-surface-variant">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex gap-4 flex-wrap">
            <button
              onClick={() => router.push("/choose-friend")}
              className="px-6 py-3 bg-primary text-on-primary rounded-2xl text-[16px] font-bold hover:bg-surface-tint active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              Start New Session
            </button>
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-2xl text-[16px] font-bold hover:bg-surface-variant active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              Customize
            </button>
          </div>
        </>
      )}
    </div>
  );
}
