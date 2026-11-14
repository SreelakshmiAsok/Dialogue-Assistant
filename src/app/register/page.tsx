"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Wake up Render backend in the background while user fills form
  useEffect(() => {
    fetch(`${API_BASE}/characters`).catch(() => {});
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!confirmed) {
      setError("Please confirm you are a parent or educator.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          parent_name: parentName,
          child_name: childName
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server is still waking up — please try again in a few seconds.");
      }
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
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
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[32px] shadow-ambient w-full max-w-md">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
          </div>
          <h1 className="text-[28px] font-bold text-center mb-1 text-on-surface">Parent Sign Up</h1>
          <p className="text-center text-on-surface-variant text-[15px] mb-6">Create an account for your child</p>
        
        {error && <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-4 text-[14px] font-semibold">{error}</div>}
        {success && <div className="bg-secondary-container text-on-secondary-container px-4 py-3 rounded-xl mb-4 font-semibold text-center text-[14px]">Registration successful! Redirecting to login...</div>}
        
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] font-semibold text-on-surface-variant mb-1.5">Parent/Educator Name</label>
            <input 
              type="text" 
              className="w-full h-[52px] px-4 text-[16px] bg-surface-container border-2 border-outline-variant rounded-2xl focus:border-primary focus:outline-none transition-colors" 
              value={parentName} 
              onChange={e => setParentName(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-on-surface-variant mb-1.5">Child/Student Name</label>
            <input 
              type="text" 
              className="w-full h-[52px] px-4 text-[16px] bg-surface-container border-2 border-outline-variant rounded-2xl focus:border-primary focus:outline-none transition-colors" 
              value={childName} 
              onChange={e => setChildName(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-on-surface-variant mb-1.5">Email</label>
            <input 
              type="email" 
              className="w-full h-[52px] px-4 text-[16px] bg-surface-container border-2 border-outline-variant rounded-2xl focus:border-primary focus:outline-none transition-colors" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-on-surface-variant mb-1.5">Password (min 6 characters)</label>
            <input 
              type="password" 
              className="w-full h-[52px] px-4 text-[16px] bg-surface-container border-2 border-outline-variant rounded-2xl focus:border-primary focus:outline-none transition-colors" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          <div className="flex items-start gap-2 mt-2">
            <input 
              type="checkbox" 
              id="confirmParent"
              className="mt-1 h-5 w-5 shrink-0"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
            />
            <label htmlFor="confirmParent" className="text-[14px] leading-snug text-on-surface-variant">
              I confirm that I am a parent, guardian, or educator setting up this account for a child.
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[54px] bg-primary text-on-primary rounded-2xl text-[17px] font-bold mt-2 shadow-sm hover:bg-surface-tint active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Creating account... (waking server)" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-on-surface-variant text-sm">
          Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  </div>
  );
}
