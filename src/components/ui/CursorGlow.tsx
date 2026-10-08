"use client";

import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0",
        "bg-accent/5 rounded-full blur-[120px] opacity-20"
      )}
    />
  );
}
