"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Loader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center",
            "bg-surface-50"
          )}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center gap-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                stroke="#FF7A00"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, rotate: 0 }}
                animate={{ pathLength: 1, rotate: 360 }}
                transition={{
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1],
                  repeat: Infinity,
                }}
                style={{ rotate: 0 }}
              />
              <motion.path
                d="M24 14L24 22"
                stroke="#FF7A00"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <motion.path
                d="M24 26L24 34"
                stroke="#FF7A00"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
              />
            </svg>
            <span className="text-primary/30 text-sm font-mono tracking-widest uppercase">
              Loading
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
