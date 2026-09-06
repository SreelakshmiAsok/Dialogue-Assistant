"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      setToken(data.access_token, data.role);
      
      if (data.role === "parent") {
        router.push("/profiles");
      } else {
        router.push("/choose-friend");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6">
      <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md">
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
          <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-full font-bold mt-2 shadow-md">
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-on-surface-variant text-sm">
          Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}
