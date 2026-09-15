export interface AppSettings {
  childName: string;
  enabledModules: string[];
}

const SETTINGS_KEY = "serene_path_settings";

export const defaultSettings: AppSettings = {
  childName: "Arjun",
  enabledModules: ["father", "teacher", "friend", "stranger"],
};

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        childName: typeof parsed.childName === "string" ? parsed.childName : defaultSettings.childName,
        enabledModules: Array.isArray(parsed.enabledModules) && parsed.enabledModules.length > 0 
          ? parsed.enabledModules 
          : defaultSettings.enabledModules,
      };
    }
  } catch (e) {
    console.error("Failed to read settings", e);
  }
  return defaultSettings;
}

export function saveAppSettings(settings: Partial<AppSettings>): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  const current = getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
  return updated;
}
