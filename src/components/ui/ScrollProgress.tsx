"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (val) => {
      if (val > 0.02 && !visible) setVisible(true);
      if (val < 0.01 && visible) setVisible(false);
    });
    return () => unsubscribe();
  }, [scrollYProgress, visible]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[9998] origin-left bg-gradient-to-r from-accent via-orange-400 to-amber-400"
      style={{ scaleX, opacity: visible ? 1 : 0 }}
    />
  );
}
