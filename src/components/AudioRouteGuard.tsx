"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stopAll } from "@/lib/audioManager";

/** Stops all audio whenever the route changes (and when the app unmounts). */
export default function AudioRouteGuard() {
  const pathname = usePathname();
  useEffect(() => {
    return () => stopAll();
  }, [pathname]);
  return null;
}
