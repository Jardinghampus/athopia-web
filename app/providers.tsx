"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";

export function Providers({ children }: { children: ReactNode }) {
  // Lazy init så klienten skapas en gång per browser-session, aldrig på modulnivå
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 300_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user": alla motion-komponenter stänger av transform-
          animationer när prefers-reduced-motion är satt (opacity behålls). */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
