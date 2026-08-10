"use client";

import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", icon: "home", path: "/dashboard" },
  { label: "History", icon: "history", path: "/dashboard/history" },
  { label: "Settings", icon: "settings", path: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="bg-background text-on-background min-h-screen font-sans antialiased flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-[240px] bg-surface-container-low border-r border-surface-variant p-6 shrink-0 sticky top-0 h-screen">
        <button
          onClick={() => router.push("/")}
          className="text-left mb-10"
        >
          <h2 className="text-[24px] font-bold text-primary leading-[32px]">Serene Path</h2>
          <p className="text-[13px] font-medium text-on-surface-variant">Therapy Assistant</p>
        </button>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[16px] font-semibold transition-all text-left ${
                  isActive
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Back to app */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          Back to App
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-surface-variant flex justify-around py-2 z-50">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                isActive ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
        <button
          onClick={() => router.push("/")}
          className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[24px]">home</span>
          App
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-h-screen pb-24 md:pb-0">
        {children}
      </main>
    </div>
  );
}
