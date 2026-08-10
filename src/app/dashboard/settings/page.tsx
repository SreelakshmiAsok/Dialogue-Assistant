"use client";

import { useState } from "react";
import { CHARACTERS } from "@/lib/characters";

export default function SettingsPage() {
  const [difficulty, setDifficulty] = useState(2);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [visualAnimations, setVisualAnimations] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [childName, setChildName] = useState("");
  const [enabledModules, setEnabledModules] = useState<string[]>(
    CHARACTERS.map((c) => c.id)
  );
  const [saved, setSaved] = useState(false);

  const toggleModule = (id: string) => {
    setEnabledModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    // In a real app, persist to localStorage or backend
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "serene_path_settings",
        JSON.stringify({
          difficulty,
          audioFeedback,
          visualAnimations,
          highContrast,
          childName,
          enabledModules,
        })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const difficultyLabels = ["", "Gentle", "Standard", "Challenging"];

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="text-[28px] md:text-[36px] font-bold text-on-surface mb-2">
        Customization & Settings
      </h1>
      <p className="text-[16px] text-on-surface-variant mb-8">
        Tailor the learning environment to best support your child&apos;s needs.
      </p>

      {/* Child Name */}
      <div className="bg-surface-container rounded-3xl p-6 mb-6">
        <h2 className="text-[18px] font-bold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-primary">person</span>
          Child&apos;s Name
        </h2>
        <p className="text-[14px] text-on-surface-variant mb-4">Personalize greetings and feedback messages.</p>
        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="e.g. Arjun"
          maxLength={20}
          className="w-full max-w-sm px-5 py-3 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl text-[18px] text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Difficulty Level */}
        <div className="bg-surface-container rounded-3xl p-6">
          <h2 className="text-[18px] font-bold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">speed</span>
            Difficulty Level
          </h2>
          <p className="text-[14px] text-on-surface-variant mb-8">
            Adjust the complexity of learning tasks and pacing.
          </p>

          {/* Custom Slider */}
          <div className="flex items-center justify-between mb-3 px-4">
            {[1, 2, 3].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`w-12 h-12 rounded-full text-[16px] font-bold transition-all flex items-center justify-center ${
                  difficulty === level
                    ? "bg-primary text-on-primary shadow-ambient scale-110"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Track */}
          <div className="relative h-1.5 bg-surface-container-high rounded-full mx-4 mb-3">
            <div
              className="absolute h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((difficulty - 1) / 2) * 100}%` }}
            />
          </div>

          <div className="flex justify-between px-4">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`text-[13px] font-semibold transition-colors ${
                  difficulty === level ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {difficultyLabels[level]}
              </span>
            ))}
          </div>
        </div>

        {/* Sensory Preferences */}
        <div className="bg-surface-container rounded-3xl p-6">
          <h2 className="text-[18px] font-bold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">tune</span>
            Sensory Preferences
          </h2>
          <p className="text-[14px] text-on-surface-variant mb-6">
            Manage audiovisual feedback for a low-arousal environment.
          </p>

          <div className="space-y-4">
            {/* Audio Feedback */}
            <div className="flex items-center justify-between bg-surface-container-low rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-on-surface-variant">volume_up</span>
                <div>
                  <p className="text-[15px] font-bold text-on-surface">Audio Feedback</p>
                  <p className="text-[13px] text-on-surface-variant">Gentle sounds on correct actions</p>
                </div>
              </div>
              <button
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`w-14 h-8 rounded-full transition-all relative ${
                  audioFeedback ? "bg-primary" : "bg-outline-variant"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow absolute top-1 transition-all ${
                    audioFeedback ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Visual Animations */}
            <div className="flex items-center justify-between bg-surface-container-low rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-on-surface-variant">animation</span>
                <div>
                  <p className="text-[15px] font-bold text-on-surface">Visual Animations</p>
                  <p className="text-[13px] text-on-surface-variant">Soft transitions and subtle movement</p>
                </div>
              </div>
              <button
                onClick={() => setVisualAnimations(!visualAnimations)}
                className={`w-14 h-8 rounded-full transition-all relative ${
                  visualAnimations ? "bg-primary" : "bg-outline-variant"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow absolute top-1 transition-all ${
                    visualAnimations ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between bg-surface-container-low rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-on-surface-variant">contrast</span>
                <div>
                  <p className="text-[15px] font-bold text-on-surface">High Contrast</p>
                  <p className="text-[13px] text-on-surface-variant">Increase visual distinction of elements</p>
                </div>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-14 h-8 rounded-full transition-all relative ${
                  highContrast ? "bg-primary" : "bg-outline-variant"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow absolute top-1 transition-all ${
                    highContrast ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Library Access */}
      <div className="bg-surface-container rounded-3xl p-6 mb-8">
        <h2 className="text-[18px] font-bold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-primary">library_books</span>
          Scenario Library Access
        </h2>
        <p className="text-[14px] text-on-surface-variant mb-6">
          Select which learning modules are available on the home screen.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {CHARACTERS.map((char) => {
            const isEnabled = enabledModules.includes(char.id);
            return (
              <button
                key={char.id}
                onClick={() => toggleModule(char.id)}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all text-left ${
                  isEnabled
                    ? "bg-primary-container ring-2 ring-primary"
                    : "bg-surface-container-low border-2 border-outline-variant opacity-60"
                }`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                  <img src={char.imagePath} alt={char.displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className={`text-[14px] font-bold ${isEnabled ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                    {char.displayName}
                  </p>
                  <p className="text-[12px] text-on-surface-variant">{char.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-8 py-4 rounded-2xl text-[18px] font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm ${
            saved
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-primary text-on-primary hover:bg-surface-tint"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {saved ? "check_circle" : "save"}
          </span>
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
