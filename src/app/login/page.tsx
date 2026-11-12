"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Wake up Render backend in the background while user types credentials
  useEffect(() => {
    fetch(`${API_BASE}/characters`).catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server is still waking up — please try again in a few seconds.");
      }
      if (!res.ok) throw new Error(data.error || "Login failed");

      setToken(data.access_token, data.role);
      
      if (data.role === "parent") {
        router.push("/profiles");
      } else {
        router.push("/choose-friend");
      }
    } catch (err: any) {
      setError(err.message || "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background p-6">
      {/* Back to Home Button */}
      <div className="w-full max-w-md mx-auto mb-2">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-[15px] font-semibold py-2 px-1"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          <span>Back to Home</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md border border-outline-variant/30">
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">Login</h1>
        {error && <div className="bg-error-container text-on-error-container p-3 rounded-md mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input 
              type="email" 
              className="w-full p-3 border rounded-lg" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Password</label>
            <input 
              type="password" 
              className="w-full p-3 border rounded-lg" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded-full font-bold mt-2 shadow-md disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Signing in... (waking server)" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-on-surface-variant text-sm">
          Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Sign up here</Link>
        </p>
      </div>
    </div>
  </div>
  );
}
