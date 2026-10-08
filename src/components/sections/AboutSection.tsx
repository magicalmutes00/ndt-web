"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { useContent } from "../../content/ContentProvider";
import { Icon } from "../ui/Icon";

export function AboutSection() {
  const { settings: siteConfig, collections } = useContent();
  const { specialties, whyChooseUs } = collections;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section ref={ref} id="about" className="relative py-24 md:py-32 overflow-hidden bg-surface">
      <div className="noise-bg absolute inset-0" />
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
            About Us
          </span>
          <h2 className="font-display text-display-md font-bold tracking-tight mb-4 text-primary">
            Shaping the Future of{" "}
            <span className="gradient-text">NDT Excellence</span>
          </h2>
          <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
            {siteConfig.fullName} — ISO 9001:2015 Certified NDT training institute in Example City, offering professional training by experts with 100% placement assistance.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div style={{ x }} className="relative">
              <div className="glass-card p-8 md:p-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] to-transparent" />
                <h3 className="font-display text-2xl font-semibold mb-4 text-primary">
                  What is NDT?
                </h3>
                <p className="text-primary/50 leading-relaxed mb-6">
                  Non-Destructive Testing (NDT) is a testing and analysis technique used by industry to evaluate the properties of a material, component, structure or system for characteristic differences or welding defects and discontinuities without causing damage to the original part.
                </p>
                <p className="text-accent font-medium text-sm">
                  100% Placement Assistance for NDT related Jobs
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-steel-400/5 rounded-full blur-3xl" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="font-display text-xl font-semibold mb-6 text-primary">
              Our Specialty
            </h3>
            {specialties.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-surface-50 border border-surface-200"
              >
                <span className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Check className="w-4 h-4" />
                </span>
                <span className="text-primary/70 text-sm">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {whyChooseUs.map((item, i) => {
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-6 glass-card-hover group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/20 transition-colors duration-300">
                  <Icon name={item.icon} className="w-5 h-5" />
                </div>
                <h4 className="font-display font-semibold text-sm mb-2 text-primary">{item.title}</h4>
                <p className="text-primary/50 text-xs leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
