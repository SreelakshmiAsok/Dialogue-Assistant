"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setError("Please confirm you are a parent or educator.");
      return;
    }
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          parent_name: parentName,
          child_name: childName
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
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
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">Parent Sign Up</h1>
        
        {error && <div className="bg-error-container text-on-error-container p-3 rounded-md mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4 font-semibold text-center">Registration successful! Redirecting to login...</div>}
        
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1">Parent/Educator Name</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-lg" 
              value={parentName} 
              onChange={e => setParentName(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Child/Student Name</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-lg" 
              value={childName} 
              onChange={e => setChildName(e.target.value)} 
              required 
            />
          </div>
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
            <label className="block font-semibold mb-1">Password (min 6 characters)</label>
            <input 
              type="password" 
              className="w-full p-3 border rounded-lg" 
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
              className="mt-1"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
            />
            <label htmlFor="confirmParent" className="text-sm">
              I confirm that I am a parent, guardian, or educator setting up this account for a child.
            </label>
          </div>
          <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-full font-bold mt-2 shadow-md">
            Create Account
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
