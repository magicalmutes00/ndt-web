import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SEO } from "../components/ui/SEO";
import { Button } from "../components/ui/Button";
import { useContent } from "../content/ContentProvider";

export default function ApplyPage() {
  const { settings: siteConfig } = useContent();

  return (
    <div className="pt-24 md:pt-28 bg-surface">
      <SEO title="Apply Now" description={`Apply for NDT training at ${siteConfig.fullName}. Start your career in Non-Destructive Testing with ASNT Level II certification.`} path="/apply" />
      <section className="relative py-24 overflow-hidden">
        <div className="noise-bg absolute inset-0" />
        <div className="industrial-grid absolute inset-0 opacity-30" />

        <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-display-lg font-bold tracking-tight mb-4 text-primary">
              Apply <span className="gradient-text">Now</span>
            </h1>
            <p className="text-primary/50 text-lg">
              Take the first step toward your NDT career
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card p-8 md:p-10"
          >
            <form className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-primary/50 font-mono tracking-wider mb-2 block">Full Name</label>
                  <input type="text" className="w-full h-12 px-4 rounded-xl bg-surface-100 border border-surface-200 text-primary placeholder:text-primary/30 text-sm focus:border-accent/30 transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs text-primary/50 font-mono tracking-wider mb-2 block">Email</label>
                  <input type="email" className="w-full h-12 px-4 rounded-xl bg-surface-100 border border-surface-200 text-primary placeholder:text-primary/30 text-sm focus:border-accent/30 transition-all" placeholder="john@example.com" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-primary/50 font-mono tracking-wider mb-2 block">Phone</label>
                  <input type="tel" className="w-full h-12 px-4 rounded-xl bg-surface-100 border border-surface-200 text-primary placeholder:text-primary/30 text-sm focus:border-accent/30 transition-all" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="text-xs text-primary/50 font-mono tracking-wider mb-2 block">Course Interested In</label>
                  <select className="w-full h-12 px-4 rounded-xl bg-surface-100 border border-surface-200 text-primary/60 text-sm focus:border-accent/30 transition-all">
                    <option value="">Select a course</option>
                    <option value="ut">Ultrasonic Testing (UT)</option>
                    <option value="rt">Radiographic Testing (RT)</option>
                    <option value="pt">Penetrant Testing (PT)</option>
                    <option value="mt">Magnetic Particle Testing (MT)</option>
                    <option value="vt">Visual Testing (VT)</option>
                    <option value="et">Eddy Current Testing (ET)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-primary/50 font-mono tracking-wider mb-2 block">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl bg-surface-100 border border-surface-200 text-primary placeholder:text-primary/30 text-sm focus:border-accent/30 transition-all resize-none" placeholder="Any additional information..." />
              </div>
              <Button variant="accent" size="xl" className="w-full">
                Submit Application
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
