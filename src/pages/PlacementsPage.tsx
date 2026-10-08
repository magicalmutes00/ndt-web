import { motion } from "framer-motion";
import { ArrowUpRight, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "../components/ui/SEO";
import { useContent } from "../content/ContentProvider";
import { Button } from "../components/ui/Button";
import { useEffect, useRef, useState } from "react";
import type { Stat } from "../../shared/content/schema.js";

function StatCard({ stat, delay }: { stat: Stat; delay: number }) {
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
          const step = Math.ceil(stat.value / (duration / 16));
          const timer = setInterval(() => {
            start += step;
            if (start >= stat.value) {
              setCount(stat.value);
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
  }, [stat.value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-8 text-center"
    >
      <div className="font-display text-5xl font-bold text-primary mb-1">
        {count}{stat.suffix}
      </div>
      <div className="text-primary/50">{stat.label}</div>
    </motion.div>
  );
}

export default function PlacementsPage() {
  const { collections } = useContent();
  const stats = collections.stats;

  return (
    <div className="pt-24 md:pt-28 bg-surface">
      <SEO title="Placements" description="100% placement assistance for NDT professionals. NDT Institute & Services provides job opportunities in India, UAE, Qatar, Singapore & Saudi Arabia across Oil & Gas, Offshore & Shipyard." path="/placements" />
      <section className="relative py-24 overflow-hidden">
        <div className="noise-bg absolute inset-0" />
        <div className="industrial-grid absolute inset-0 opacity-20" />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
              Placements
            </span>
            <h1 className="font-display text-display-lg font-bold tracking-tight mb-4 text-primary">
              Placement <span className="gradient-text">Assistance</span>
            </h1>
            <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
              100% placement assistance for NDT-related jobs in India & abroad
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} delay={i * 0.1} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="glass-card p-8 max-w-4xl mx-auto text-center"
          >
            <Globe className="w-8 h-8 text-accent/40 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-3 text-primary">Global Placement Network</h3>
            <p className="text-primary/50 leading-relaxed mb-6">
              We provide manpower services for NDT-related jobs in India & abroad across Oil & Gas, Offshore, and Shipyard industries. Our network spans across UAE, Qatar, Singapore, Saudi Arabia, and major industrial hubs in India.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {["ASNT Level II & III", "PCN Level 2 & 3", "ISO 9712 Level 2 & 3", "CSWIP 3.1/3.2", "API 510/570/653", "IRATA Level 1,2,3"].map((cert) => (
                <span key={cert} className="px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-200 text-primary/50 text-xs">
                  {cert}
                </span>
              ))}
            </div>
            <Button variant="accent" size="lg" asChild>
              <Link to="/contact">
                Apply for Placement <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
