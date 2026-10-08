import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "../components/ui/SEO";
import { useContent } from "../content/ContentProvider";
import { Icon } from "../components/ui/Icon";
import { Button } from "../components/ui/Button";

export default function CoursesPage() {
  const { collections } = useContent();
  const courses = collections.courses;

  return (
    <div className="pt-24 md:pt-28 bg-surface">
      <SEO title="Courses" description="ASNT Level II NDT certification courses — UT, RT, PT, MT, VT, ET. Hands-on training with globally recognized instruments." path="/courses" />
      <section className="relative py-24 overflow-hidden">
        <div className="industrial-grid absolute inset-0 opacity-30" />
        <div className="noise-bg absolute inset-0" />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
              Courses
            </span>
            <h1 className="font-display text-display-lg font-bold tracking-tight mb-4 text-primary">
              NDT <span className="gradient-text">Certification Courses</span>
            </h1>
            <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
              ASNT Level II certified training with hands-on experience on industry-standard equipment
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {courses.map((course, i) => {
              return (
                <motion.div
                  key={course.id}
                  id={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  className="glass-card p-6 glass-card-hover"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent">
                      <Icon name={course.icon} className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono text-accent/60 font-medium tracking-wider">{course.code}</span>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2 text-primary">{course.name}</h3>
                  <p className="text-primary/50 text-sm leading-relaxed mb-4">{course.description}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-200 text-[11px] text-primary/50 font-mono">{course.duration}</div>
                    <div className="px-2.5 py-1 rounded-lg bg-accent/5 border border-accent/10 text-[11px] text-accent/70 font-mono">{course.certification}</div>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {course.topics.slice(0, 4).map((topic) => (
                      <div key={topic} className="flex items-center gap-2 text-xs text-primary/50">
                        <span className="w-1 h-1 rounded-full bg-accent/40" />
                        {topic}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/contact">
                      Enroll Now <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-10"
          >
            <Button variant="accent" size="lg" asChild>
              <Link to="/contact">
                Apply Now <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
