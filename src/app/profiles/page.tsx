"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken, getAuthHeaders, getRole } from "@/lib/auth";

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

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background text-on-background">
      <h1 className="text-4xl font-bold mb-10 text-primary">Who is playing?</h1>
      
      <div className="flex flex-wrap gap-8 justify-center">
        {/* Parent Dashboard Profile */}
        <div 
          onClick={() => router.push("/parent-access")} 
          className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="w-32 h-32 rounded-full bg-secondary-container flex items-center justify-center text-4xl mb-4 shadow-lg">
            🧑‍🏫
          </div>
          <span className="font-semibold text-lg">Parent Dashboard</span>
        </div>

        {/* Child Profiles */}
        {children.map((child) => (
          <div 
            key={child.id}
            onClick={() => handleAssumeChild(child.id)}
            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-32 h-32 rounded-full bg-primary-container flex items-center justify-center text-4xl mb-4 shadow-lg">
              🧒
            </div>
            <span className="font-semibold text-lg">{child.name || child.email.split("@")[0]}</span>
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
