"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRole, getAuthHeaders } from "@/lib/auth";

export default function ParentAccess() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const role = getRole();
    const token = getToken();
    if (!token || role !== "parent") {
      router.push("/login");
    }
  }, [router]);

  const handleVerifyPassword = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5001/api/auth/verify-password", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Incorrect password");
      }

      // Granted access
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Incorrect password");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }, [password, router]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation header */}
      <header className="p-6 flex items-center justify-between w-full max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/profiles")}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-[15px] font-semibold"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          <span>Back to Profiles</span>
        </button>

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-[14px] font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span>Home</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="bg-surface-container-lowest rounded-[32px] shadow-ambient p-8 md:p-12 max-w-md w-full text-center">
          {/* Shield icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>

          <h1 className="text-[28px] md:text-[34px] font-bold text-on-surface mb-2">
            Parent Access
          </h1>
          <p className="text-[15px] md:text-[16px] text-on-surface-variant leading-relaxed mb-6">
            Please enter your account password to unlock parent controls and settings.
          </p>

          <form onSubmit={handleVerifyPassword} className="flex flex-col gap-4">
            {/* Password input card */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="w-full h-[56px] px-4 pr-12 text-[16px] bg-surface-container border-2 border-outline-variant rounded-2xl text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="Enter parent password"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-sm font-medium"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 text-[14px] font-semibold text-left flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-[54px] bg-primary text-on-primary rounded-2xl text-[17px] font-bold flex items-center justify-center gap-2 hover:bg-surface-tint active:scale-95 transition-all shadow-sm disabled:opacity-60"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify Password</span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    lock_open
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
