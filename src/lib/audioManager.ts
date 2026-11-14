/**
 * Central audio manager: STRICT SINGLE-AUDIO RULE for the whole app.
 *
 * 1. Every playback goes through playSequence(); it always calls stopAll() first.
 * 2. A token invalidates any in-flight sequence, so a cancelled sequence can never
 *    resume (no stray fallbacks, no delayed "next item", no restart after unmount).
 * 3. Handlers are detached BEFORE the element is torn down, so clearing `src`
 *    cannot fire an `error` event that would trigger a speech-synthesis fallback.
 * 4. State lives on `window` (not in module scope), so a duplicated module instance
 *    (hot reload, split chunks) still shares ONE token / ONE element.
 * 5. Document-level guard: whenever ANY media element starts playing, every other
 *    media element is paused and the speechSynthesis queue is cancelled; whenever
 *    speechSynthesis speaks, all media elements are paused. Even code that bypasses
 *    this manager cannot produce two voices at once.
 */

export interface AudioItem {
  url: string;
  /** Tamil text used only as a browser-voice fallback if the audio file fails */
  text?: string;
}

export type PlayResult = "done" | "cancelled" | "blocked";

interface AudioState {
  token: number;
  audio: HTMLAudioElement | null;
  cancelPending: (() => void) | null;
  guardInstalled: boolean;
  /** every media element that has ever called play() (detached `new Audio()` included) */
  media: Set<HTMLMediaElement>;
}

function state(): AudioState {
  const w = (typeof window !== "undefined" ? window : globalThis) as unknown as {
    __navilAudio?: AudioState;
  };
  if (!w.__navilAudio) {
    w.__navilAudio = { token: 0, audio: null, cancelPending: null, guardInstalled: false, media: new Set() };
  }
  if (!w.__navilAudio.media) w.__navilAudio.media = new Set();
  return w.__navilAudio;
}

function cancelSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

function silenceElement(a: HTMLMediaElement) {
  try {
    a.onended = null;
    a.onerror = null;
    a.pause();
    a.removeAttribute("src");
    a.load();
  } catch {
    /* ignore */
  }
}

/** Pause every media element in the document except `keep`. */
function pauseAllMediaExcept(keep?: EventTarget | null) {
  if (typeof document === "undefined") return;
  state().media.forEach((el) => {
    if (el !== keep) {
      try {
        el.pause();
      } catch {
        /* ignore */
      }
    }
    if (el.paused || el.ended) state().media.delete(el);
  });
  document.querySelectorAll("audio,video").forEach((el) => {
    if (el !== keep) (el as HTMLMediaElement).pause();
  });
}

/** Stop everything that is playing or queued, immediately. */
export function stopAll(): void {
  const s = state();
  s.token++;
  if (s.audio) {
    const a = s.audio;
    s.audio = null;
    silenceElement(a);
  }
  pauseAllMediaExcept(null);
  cancelSpeech();
  if (s.cancelPending) {
    const resolve = s.cancelPending;
    s.cancelPending = null;
    resolve();
  }
}

function speakFallback(text: string, myToken: number): Promise<void> {
  const s = state();
  return new Promise((resolve) => {
    if (myToken !== s.token || typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    cancelSpeech();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ta-IN";
    u.rate = 0.9;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    s.cancelPending = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

function playOne(item: AudioItem, myToken: number): Promise<"ended" | "cancelled" | "blocked"> {
  const s = state();
  return new Promise((resolve) => {
    if (myToken !== s.token) return resolve("cancelled");
    const a = new Audio();
    s.audio = a;
    s.cancelPending = () => resolve("cancelled");

    const finish = (r: "ended" | "cancelled" | "blocked") => {
      if (s.audio === a) {
        a.onended = null;
        a.onerror = null;
        s.audio = null;
      }
      s.cancelPending = null;
      resolve(r);
    };

    a.onended = () => finish("ended");
    a.onerror = () => {
      // File failed to load/generate: use the browser Tamil voice, only if still current
      if (myToken !== s.token) return finish("cancelled");
      s.audio = null;
      speakFallback(item.text || "", myToken).then(() =>
        resolve(myToken === s.token ? "ended" : "cancelled")
      );
    };
    a.src = item.url;
    const p = a.play();
    if (p && typeof p.catch === "function") {
      p.catch((err: unknown) => {
        if (myToken !== s.token) return finish("cancelled");
        const name = (err as { name?: string } | null)?.name;
        if (name === "NotAllowedError") return finish("blocked");
        if (name === "AbortError") return finish("cancelled");
        a.onerror?.(new Event("error"));
      });
    }
  });
}

/**
 * Play items one after another. Stops anything already playing first.
 * Resolves "cancelled" if something else started/stopped playback meanwhile.
 */
export async function playSequence(items: AudioItem[]): Promise<PlayResult> {
  stopAll();
  const s = state();
  const myToken = s.token;
  for (const item of items) {
    if (!item.url) continue;
    if (myToken !== s.token) return "cancelled";
    const r = await playOne(item, myToken);
    if (r === "blocked") return "blocked";
    if (r === "cancelled" || myToken !== s.token) return "cancelled";
  }
  return myToken === s.token ? "done" : "cancelled";
}

export const playOneItem = (item: AudioItem) => playSequence([item]);

/** Installed once per page: enforces the single-audio rule even for callers that bypass playSequence. */
function installGuard() {
  if (typeof window === "undefined") return;
  const s = state();
  if (s.guardInstalled) return;
  s.guardInstalled = true;

  // Any media element (attached or a detached `new Audio()`) that calls play() first silences
  // every other element and the speech queue, then is registered as the one allowed to play.
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    pauseAllMediaExcept(this);
    cancelSpeech();
    state().media.add(this);
    return originalPlay.apply(this);
  };

  // Browser speech starting silences every media element.
  if ("speechSynthesis" in window) {
    const synth = window.speechSynthesis;
    const originalSpeak = synth.speak.bind(synth);
    synth.speak = (u: SpeechSynthesisUtterance) => {
      pauseAllMediaExcept(null);
      return originalSpeak(u);
    };
  }

  window.addEventListener("pagehide", stopAll);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") stopAll();
  });
}

installGuard();
