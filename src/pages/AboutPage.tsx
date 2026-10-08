import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SEO } from "../components/ui/SEO";
import { useContent } from "../content/ContentProvider";
import { Icon } from "../components/ui/Icon";

export default function AboutPage() {
  const { settings: siteConfig, collections } = useContent();
  const { specialties, whyChooseUs, certifications } = collections;

  return (
    <div className="pt-24 md:pt-28 bg-surface-50">
      <SEO title="About" description="Learn about NDT Institute & Services — ISO 9001:2015 certified NDT training institute in Example City with 5+ years of excellence and 100% placement assistance." path="/about" />
      <section className="relative py-24 overflow-hidden">
        <div className="noise-bg absolute inset-0" />
        <div className="industrial-grid absolute inset-0 opacity-30" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
              About
            </span>
            <h1 className="font-display text-display-lg font-bold tracking-tight mb-6 text-primary">
              About <span className="gradient-text">{siteConfig.name}</span>
            </h1>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="space-y-5"
            >
              <p className="text-primary/50 leading-relaxed">
                <strong className="text-primary">{siteConfig.fullName}</strong> is one of the Best NDT training institutes in Example City, offering professional training by experts for more than {siteConfig.yearsExperience} years with 100% placement assistance.
              </p>
              <p className="text-primary/50 leading-relaxed">
                We provide training and certification to NDT courses. We also provide manpower services for NDT-related jobs.
              </p>
              <div className="flex items-center gap-4 mt-6">
                {certifications.map((cert) => (
                  <div key={cert} className="px-4 py-2 rounded-xl bg-surface-100 border border-surface-200 text-primary/50 text-xs font-mono">
                    {cert} Certified
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="glass-card p-8"
            >
              <h3 className="font-display font-semibold text-lg mb-4 text-primary">Our Specialty</h3>
              <div className="space-y-3">
                {specialties.map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="text-primary/60 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyChooseUs.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="glass-card p-6 glass-card-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent mb-4">
                  <Icon name={item.icon} className="w-5 h-5" />
                </div>
                <h4 className="font-display font-semibold text-sm mb-2 text-primary">{item.title}</h4>
                <p className="text-primary/50 text-xs leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
