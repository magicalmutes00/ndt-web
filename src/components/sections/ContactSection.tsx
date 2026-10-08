"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, ArrowUpRight } from "lucide-react";
import { useContent } from "../../content/ContentProvider";
import { Button } from "../ui/Button";

export function ContactSection() {
  const { settings: siteConfig } = useContent();

  return (
    <section id="contact" className="relative py-24 md:py-32 overflow-hidden bg-surface-50">
      <div className="noise-bg absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-transparent" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
            Contact
          </span>
          <h2 className="font-display text-display-md font-bold tracking-tight mb-4 text-primary">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
            Ready to start your NDT career? Reach out to us
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card p-8"
          >
            <h3 className="font-display text-xl font-semibold mb-6 text-primary">Send us a Message</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full h-12 px-4 rounded-xl bg-surface-100 border border-surface-200 text-primary placeholder:text-primary/30 text-sm focus:border-accent/30 focus:bg-white transition-all duration-300"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full h-12 px-4 rounded-xl bg-surface-100 border border-surface-200 text-primary placeholder:text-primary/30 text-sm focus:border-accent/30 focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full h-12 px-4 rounded-xl bg-surface-100 border border-surface-200 text-primary placeholder:text-primary/30 text-sm focus:border-accent/30 focus:bg-white transition-all duration-300"
                />
              </div>
              <div>
                <textarea
                  rows={4}
                  placeholder="Your Message"
                  className="w-full px-4 py-3 rounded-xl bg-surface-100 border border-surface-200 text-primary placeholder:text-primary/30 text-sm focus:border-accent/30 focus:bg-white transition-all duration-300 resize-none"
                />
              </div>
              <Button variant="accent" size="lg" className="w-full">
                <Send className="w-4 h-4" />
                Send Message
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="space-y-5"
          >
            <div className="glass-card p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1 text-primary">Address</p>
                  <p className="text-primary/50 text-sm leading-relaxed">{siteConfig.address.full}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1 text-primary">Call Us</p>
                  <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="text-primary/50 hover:text-accent text-sm block transition-colors">{siteConfig.phone}</a>
                  {siteConfig.phoneAlt && (
                    <a href={`tel:${siteConfig.phoneAlt.replace(/\s/g, "")}`} className="text-primary/50 hover:text-accent text-sm block transition-colors">{siteConfig.phoneAlt}</a>
                  )}
                  <span className="text-primary/30 text-xs block mt-0.5">{siteConfig.phoneLandline}</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1 text-primary">Email Us</p>
                  <a href={`mailto:${siteConfig.email}`} className="text-primary/50 hover:text-accent text-sm block transition-colors">{siteConfig.email}</a>
                  <a href={`mailto:${siteConfig.emailAlt}`} className="text-primary/50 hover:text-accent text-sm block transition-colors">{siteConfig.emailAlt}</a>
                </div>
              </div>
            </div>

            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between glass-card p-6 glass-card-hover group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Chat on WhatsApp</p>
                  <p className="text-xs text-primary/50">Quick response guaranteed</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary/30 group-hover:text-accent transition-colors" />
            </a>

            <div className="glass-card overflow-hidden rounded-3xl h-[240px]">
              <iframe
                src={siteConfig.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${siteConfig.name} Location`}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
