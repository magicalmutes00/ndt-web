"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroScene } from "../three/HeroScene";
import { ThreeWrapper } from "../three/ThreeWrapper";
import { Button } from "../ui/Button";
import { useContent } from "../../content/ContentProvider";

export function HeroSection() {
  const { settings } = useContent();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-accent/[0.03] via-surface-50 to-surface"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-surface z-10" />
      <div className="absolute inset-0 industrial-grid z-10" />

      <ThreeWrapper>
        <HeroScene />
      </ThreeWrapper>

      <motion.div
        style={{ opacity, y }}
        className="relative z-20 container mx-auto px-4 pt-24 pb-16 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/5 border border-accent/10 text-accent text-xs font-medium mb-6 font-mono tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
            ISO 9001:2015 Certified
          </div>

          <h1 className="font-display text-display-xl font-bold tracking-tight mb-4">
            <span className="gradient-text">{settings.name}</span>
          </h1>

          <p className="text-xl md:text-2xl text-primary/60 font-medium mb-3 max-w-2xl mx-auto">
            Become a Certified NDT Professional
          </p>

          <p className="text-base md:text-lg text-primary/40 max-w-xl mx-auto mb-8 leading-relaxed">
            ASNT Level II Training &middot; UT Hands-on Training &middot; 100% Placement Assistance
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="accent" size="lg" className="rounded-xl text-sm" asChild>
              <Link to="/contact">
                Apply Now
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl text-sm" asChild>
              <Link to="/courses">
                <Play className="w-4 h-4" />
                Explore Courses
              </Link>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6"
          >
            {["ASNT Level II", "UT / RT / PT / MT / VT", "Oil & Gas | Offshore | Shipyard"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-200 text-primary/40 text-xs"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-primary/30 text-[10px] font-mono tracking-widest uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-primary/10 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-1.5 rounded-full bg-accent/60"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
