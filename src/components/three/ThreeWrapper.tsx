"use client";

import { Suspense } from "react";

export function ThreeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
