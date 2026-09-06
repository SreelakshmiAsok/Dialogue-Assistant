"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken, getAuthHeaders, getRole, clearAuth } from "@/lib/auth";

export default function Profiles() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = getRole();
    if (role !== "parent") {
      router.push("/login");
      return;
    }

    const fetchChildren = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5001/api/parents/children", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setChildren(data.children || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, [router]);

  const handleAssumeChild = async (childId: string) => {
    try {
      const res = await fetch("http://127.0.0.1:5001/api/auth/assume-child", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      // Overwrite token with student token
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
      
      <div className="flex flex-wrap gap-8 justify-center">
        {/* Parent Dashboard Profile */}
        <div 
          onClick={() => router.push("/parent-access")} 
          className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="w-32 h-32 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4 shadow-lg border-2 border-outline-variant/30">
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              supervisor_account
            </span>
          </div>
          <span className="font-semibold text-lg text-on-surface">Parent Dashboard</span>
        </div>

        {/* Child Profiles */}
        {children.map((child) => (
          <div 
            key={child.id}
            onClick={() => handleAssumeChild(child.id)}
            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-32 h-32 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 shadow-lg border-2 border-outline-variant/30">
              <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                face
              </span>
            </div>
            <span className="font-semibold text-lg text-on-surface">{child.name || child.email.split("@")[0]}</span>
          </div>
        ))}
      </div>
      
      {children.length === 0 && (
        <p className="mt-10 text-on-surface-variant">
          No children linked. Please link a child in the Parent Dashboard.
        </p>
      )}
    </div>
  );
}
