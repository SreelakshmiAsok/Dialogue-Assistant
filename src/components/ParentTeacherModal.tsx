"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken, getParentToken, getToken } from "@/lib/auth";

export default function ParentTeacherModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your parent account password.");
      return;
    }

    setLoading(true);
    setError("");

    // Token to use for verifying: prefer stored parent_access_token, then active token
    const tokenToUse = getParentToken() || getToken() || "";

    try {
      const res = await fetch("http://127.0.0.1:5001/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Incorrect password");
      }

      // Restore parent role and token
      if (tokenToUse) {
        setToken(tokenToUse, "parent");
      }
      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Incorrect parent password. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-6 md:p-8 shadow-2xl border border-outline-variant/60 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">lock</span>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-on-surface">Parent / Educator Access</h2>
            <p className="text-[13px] text-on-surface-variant">Verify password to access dashboard</p>
          </div>
        </div>

        <p className="text-[14px] text-on-surface-variant mb-6">
          Please enter your <strong className="text-on-surface">account password</strong> to switch to the Parent Dashboard. No logout required.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter your login password"
              className="w-full px-5 py-3.5 bg-surface-container-low border-2 border-outline-variant rounded-2xl text-[16px] text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] text-error flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-outline-variant text-on-surface font-semibold text-[14px] hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-[14px] hover:bg-surface-tint transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
