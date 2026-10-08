"use client";

import { motion } from "framer-motion";
import { BookOpen, Wrench, Award, Briefcase, ArrowUpRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: BookOpen,
    title: "Training",
    description: "Classroom & practical training by qualified NDT experts with globally recognized instruments.",
  },
  {
    icon: Wrench,
    title: "Hands-on Lab",
    description: "Real-world lab sessions with industrial equipment including UT, RT, PT, MT, and VT methods.",
  },
  {
    icon: Award,
    title: "Certification",
    description: "ASNT Level II certification recognized worldwide across Oil & Gas, Offshore, and Shipyard industries.",
  },
  {
    icon: Briefcase,
    title: "Placement",
    description: "100% placement assistance with job opportunities in India, UAE, Qatar, Singapore, and Saudi Arabia.",
  },
];

export function TrainingFlowSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.01] to-transparent" />
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
            Our Process
          </span>
          <h2 className="font-display text-display-md font-bold tracking-tight mb-4 text-primary">
            From <span className="gradient-text">Training to Career</span>
          </h2>
          <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
            A structured pathway from learning to earning
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative text-center"
              >
                <div className="glass-card p-6 md:p-8 glass-card-hover h-full">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent mx-auto mb-5">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-accent/10 border border-accent/10 text-accent text-xs font-mono font-bold mb-3">
                    0{i + 1}
                  </div>
                  <h3 className="font-display font-semibold text-base mb-2 text-primary">{step.title}</h3>
                  <p className="text-primary/50 text-xs leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[2px] bg-gradient-to-r from-accent/30 to-transparent" />
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="text-center mt-10"
        >
          <Button variant="accent" size="lg" asChild>
            <Link to="/contact">
              Start Your Journey
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
