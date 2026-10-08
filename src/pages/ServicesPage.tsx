import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { SEO } from "../components/ui/SEO";
import { useContent } from "../content/ContentProvider";
import { Icon } from "../components/ui/Icon";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";

export default function ServicesPage() {
  const { settings, collections } = useContent();
  const services = collections.services;

  return (
    <div className="pt-24 md:pt-28 bg-surface-50">
      <SEO title="Services" description="NDT training, certification, and manpower services by NDT Institute & Services. ASNT Level II, UT hands-on training, and job consultancy for Oil & Gas industries." path="/services" />
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
              Services
            </span>
            <h1 className="font-display text-display-lg font-bold tracking-tight mb-4 text-primary">
              Our <span className="gradient-text">Services</span>
            </h1>
            <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
              Services provided by {settings.fullName}
            </p>
          </motion.div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {services.map((service, i) => {
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-card p-6 md:p-8 glass-card-hover"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Icon name={service.icon} className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg mb-2 text-primary">{service.title}</h3>
                      <p className="text-primary/50 text-sm leading-relaxed mb-4">{service.description}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {service.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm text-primary/50">
                            <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-10"
          >
            <Button variant="accent" size="lg" asChild>
              <Link to="/contact">
                Get Started <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
