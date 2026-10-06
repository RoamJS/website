"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initializeAnalytics } from "@/lib/analytics";

export const AnalyticsNavigation = (): null => {
  const pathname = usePathname();
  useEffect(() => {
    // Instrumentation runs only on entry; a public route may be reached later.
    initializeAnalytics();
  }, [pathname]);
  return null;
};
