"use client";

import { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { useContent } from "../../content/ContentProvider";
import { Icon } from "../ui/Icon";
import { useEffect, useState } from "react";

function AnimatedStat({ value, suffix = "", prefix = "", label, iconName, delay }: {
  value: number; suffix?: string; prefix?: string; label: string; iconName: string; delay: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const step = Math.ceil(value / (duration / 16));
          const timer = setInterval(() => {
            start += step;
            if (start >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-6 md:p-8 text-center glass-card-hover"
    >
      <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
        <Icon name={iconName} className="w-6 h-6" />
      </div>
      <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-1">
        {prefix}{count}{suffix}
      </div>
      <div className="text-primary/50 text-sm">{label}</div>
    </motion.div>
  );
}

export function PlacementSection() {
  const { collections } = useContent();
  const stats = collections.stats;
  const ref = useRef<HTMLElement>(null);
  useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <section ref={ref} id="placement" className="relative py-24 md:py-32 overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-accent/[0.02]" />
      <div className="industrial-grid absolute inset-0 opacity-20" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
            Placements
          </span>
          <h2 className="font-display text-display-md font-bold tracking-tight mb-4 text-primary">
            Proven <span className="gradient-text">Track Record</span>
          </h2>
          <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
            Our numbers speak for themselves
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
          {stats.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              label={stat.label}
              iconName={stat.icon}
              delay={i * 0.1}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass-card p-8 md:p-10 max-w-4xl mx-auto text-center"
        >
          <p className="text-primary/60 text-lg leading-relaxed mb-4">
            We provide manpower services for NDT-related jobs in India & abroad across{" "}
            <span className="text-primary font-medium">Oil & Gas, Offshore & Shipyard</span> industries.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {collections.placementCountries.map((country) => (
              <span
                key={country}
                className="px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-200 text-primary/50 text-xs font-mono"
              >
                {country}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
