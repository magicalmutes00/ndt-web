"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../../content/ContentProvider";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";

export function CoursesSection() {
  const { collections } = useContent();
  const courses = collections.courses;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} id="courses" className="relative py-24 md:py-32 overflow-hidden bg-surface-50">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent" />
      <div className="industrial-grid absolute inset-0 opacity-30" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
            Courses
          </span>
          <h2 className="font-display text-display-md font-bold tracking-tight mb-4 text-primary">
            NDT <span className="gradient-text">Certification Courses</span>
          </h2>
          <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
            ASNT Level II certified training with hands-on experience and 100% placement assistance
          </p>
        </motion.div>

        <motion.div style={{ y }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, i) => {
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="glass-card p-6 glass-card-hover group cursor-default"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-all duration-300">
                    <Icon name={course.icon} className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-accent/60 font-medium tracking-wider">
                    {course.code}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-primary">{course.name}</h3>
                <p className="text-primary/50 text-sm leading-relaxed mb-4 line-clamp-3">
                  {course.description}
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-200 text-[11px] text-primary/50 font-mono">
                    {course.duration}
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-accent/5 border border-accent/10 text-[11px] text-accent/70 font-mono">
                    {course.certification}
                  </div>
                </div>
                <Link
                  to={`/courses#${course.id}`}
                  className="inline-flex items-center gap-1.5 text-accent text-sm font-medium hover:gap-2.5 transition-all duration-300 group/link"
                >
                  Learn More
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-10"
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/courses">
              View All Courses
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
