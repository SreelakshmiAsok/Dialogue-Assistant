"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken, getAuthHeaders, getRole, clearAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/api";

export default function Profiles() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const role = getRole();
    if (role !== "parent") {
      router.push("/login");
      return;
    }

    const fetchChildren = async () => {
      try {
        const res = await fetch(`${API_BASE}/parents/children`, {
          headers: getAuthHeaders(),
        });
        if (res.status === 401 || res.status === 403) {
          clearAuth();
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError("Could not load child profiles. Please make sure the backend server is running.");
          return;
        }
        const data = await res.json();
        setChildren(data.children || []);
      } catch (e) {
        console.error(e);
        setError("Could not reach the server. Please make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, [router]);

  const handleAssumeChild = async (childId: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/assume-child`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const currentParentToken = getToken();
      if (currentParentToken) {
        localStorage.setItem("parent_access_token", currentParentToken);
      }
      // Set active session token to student token
      setToken(data.access_token, "student");
      router.push("/choose-friend");
    } catch (e) {
      alert("Error switching to child profile");
    }
  };

  const handleSignOut = () => {
    clearAuth();
    router.push("/");
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background">
      {/* Top Header with Back to Home and Sign Out */}
      <header className="p-6 flex items-center justify-between w-full max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-[15px] font-semibold"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          <span>Back to Home</span>
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-[14px] font-semibold px-3 py-1.5 rounded-full hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary text-center">Choose Profile</h1>
        <p className="text-on-surface-variant text-[15px] md:text-[16px] mb-10 text-center">
          Select who is learning today or manage settings
        </p>

        {error && (
          <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-6 text-sm font-medium text-center max-w-md">
            {error}
          </div>
        )}
      
      <div className="flex flex-wrap gap-6 sm:gap-10 justify-center">
        {/* Parent Dashboard Profile */}
        <button
          type="button"
          onClick={() => router.push("/parent-access")}
          className="group flex flex-col items-center cursor-pointer rounded-3xl p-3 transition-transform hover:-translate-y-1"
        >
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4 shadow-ambient border-2 border-outline-variant/30 group-hover:border-primary/60 transition-colors">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              supervisor_account
            </span>
          </div>
          <span className="font-bold text-lg text-on-surface">Parent Dashboard</span>
          <span className="text-[13px] text-on-surface-variant mt-0.5">Progress &amp; settings</span>
        </button>

        {/* Child Profiles */}
        {children.map((child) => (
          <button
            type="button"
            key={child.id}
            onClick={() => handleAssumeChild(child.id)}
            className="group flex flex-col items-center cursor-pointer rounded-3xl p-3 transition-transform hover:-translate-y-1"
          >
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 shadow-ambient border-2 border-outline-variant/30 group-hover:border-primary/60 transition-colors">
              <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                face
              </span>
            </div>
            <span className="font-bold text-lg text-on-surface">{child.name || child.email.split("@")[0]}</span>
            <span className="text-[13px] text-on-surface-variant mt-0.5">Start learning</span>
          </button>
        ))}
      </div>
      
      {children.length === 0 && (
        <p className="mt-10 text-on-surface-variant">
          No children linked. Please link a child in the Parent Dashboard.
        </p>
      )}
      </div>
    </div>
  );
}
