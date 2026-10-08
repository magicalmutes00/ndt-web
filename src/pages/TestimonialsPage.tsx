import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { SEO } from "../components/ui/SEO";
import { useContent } from "../content/ContentProvider";

export default function TestimonialsPage() {
  const { collections } = useContent();
  const testimonials = collections.testimonials;

  return (
    <div className="pt-24 md:pt-28 bg-surface">
      <SEO title="Testimonials" description="Hear from our successful NDT students. NDT Institute & Services has transformed careers with quality training and 100% placement support." path="/testimonials" />
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
              Testimonials
            </span>
            <h1 className="font-display text-display-lg font-bold tracking-tight mb-4 text-primary">
              What Our <span className="gradient-text">Students Say</span>
            </h1>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-6 md:p-8 glass-card-hover"
              >
                <Quote className="w-8 h-8 text-accent/20 mb-4" />
                <p className="text-primary/50 text-sm leading-relaxed mb-6">
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
    </div>
  );
}
