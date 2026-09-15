"use client";

import { useState, useEffect } from "react";
import { CHARACTERS } from "@/lib/characters";
import { getAppSettings, saveAppSettings } from "@/lib/settings";

export default function SettingsPage() {
  const [childName, setChildName] = useState("");
  const [enabledModules, setEnabledModules] = useState<string[]>(
    CHARACTERS.map((c) => c.id)
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = getAppSettings();
    setChildName(s.childName);
    setEnabledModules(s.enabledModules);
  }, []);

  const toggleModule = (id: string) => {
    setEnabledModules((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          alert("At least one character module must remain enabled.");
          return prev;
        }
        return prev.filter((m) => m !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSave = () => {
    saveAppSettings({
      childName: childName.trim() || "Child",
      enabledModules,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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
        <p className="text-[14px] text-on-surface-variant mb-4">
          Personalize greetings, welcome banners, and feedback across the app.
        </p>
        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="e.g. Arjun"
          maxLength={25}
          className="w-full max-w-sm px-5 py-3 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl text-[18px] text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* Scenario Library Access */}
      <div className="bg-surface-container rounded-3xl p-6 mb-8">
        <h2 className="text-[18px] font-bold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-primary">library_books</span>
          Scenario Library Access
        </h2>
        <p className="text-[14px] text-on-surface-variant mb-6">
          Choose which companion modules are unlocked and visible on the child&apos;s companion screen.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {CHARACTERS.map((char) => {
            const isEnabled = enabledModules.includes(char.id);
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => toggleModule(char.id)}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all text-left ${
                  isEnabled
                    ? "bg-primary-container ring-2 ring-primary shadow-sm"
                    : "bg-surface-container-low border-2 border-outline-variant opacity-50"
                }`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                  <img src={char.imagePath} alt={char.displayName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-[14px] font-bold truncate ${isEnabled ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                      {char.displayName}
                    </p>
                    <span className="material-symbols-outlined text-[18px] ml-1 shrink-0 text-primary">
                      {isEnabled ? "check_circle" : "cancel"}
                    </span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant truncate">{char.subtitle}</p>
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
          {saved ? "Saved Successfully!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
