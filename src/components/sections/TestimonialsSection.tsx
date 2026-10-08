"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useContent } from "../../content/ContentProvider";

export function TestimonialsSection() {
  const { collections } = useContent();
  const testimonials = collections.testimonials;
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="testimonials" className="relative py-24 md:py-32 overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.01] to-transparent" />
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
            Testimonials
          </span>
          <h2 className="font-display text-display-md font-bold tracking-tight mb-4 text-primary">
            What Our <span className="gradient-text">Students Say</span>
          </h2>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card p-6 md:p-8 min-w-[340px] md:min-w-[400px] snap-start glass-card-hover flex-shrink-0"
            >
              <Quote className="w-8 h-8 text-accent/20 mb-4" />
              <p className="text-primary/60 text-sm leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-steel-400/30 flex items-center justify-center font-display font-semibold text-sm text-primary">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">{testimonial.name}</p>
                  <p className="text-xs text-primary/50">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
