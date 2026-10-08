"use client";

import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { useContent } from "../../content/ContentProvider";

const socialIcons: Record<string, string> = {
  youtube: "M23.5 6.2c-.3-1.1-.7-2-1.4-2.7C21 2.5 19 2.4 12 2.4s-9 .1-10.1 1.1c-.7.7-1.1 1.6-1.4 2.7C.2 7.5 0 9.5 0 12s.2 4.5.5 5.8c.3 1.1.7 2 1.4 2.7 1.1 1 3.1 1.1 10.1 1.1s9-.1 10.1-1.1c.7-.7 1.1-1.6 1.4-2.7.3-1.3.5-3.3.5-5.8s-.2-4.5-.5-5.8zM9.5 15.5V8.5l6.5 3.5-6.5 3.5z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

export function Footer() {
  const { settings: siteConfig, footer } = useContent();
  const socialLinks = footer.social;

  return (
    <footer className="relative border-t border-surface-200 bg-surface-50">
      <div className="noise-bg absolute inset-0" />

      <div className="container mx-auto px-4 md:px-8 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <span className="text-accent font-bold text-sm font-display">C</span>
              </div>
              <span className="font-display font-semibold text-sm tracking-tight text-primary">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-primary/50 text-sm leading-relaxed max-w-xs">
              {footer.blurb}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center text-primary/40 hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
                    aria-label={social.name}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d={socialIcons[social.icon] || ""} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {footer.columns.map((column) => (
            <div key={column.title}>
              <h4 className="font-display font-semibold text-sm text-primary/80 mb-4">
                {column.title}
              </h4>
              <ul className="space-y-2.5" aria-label={column.title}>
                {column.items.map((item) => (
                  <li key={`${column.title}-${item.label}`}>
                    <Link
                      to={item.path}
                      className="text-primary/50 hover:text-accent text-sm transition-colors duration-200 flex items-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-display font-semibold text-sm text-primary/80 mb-4">Contact Us</h4>
            <ul className="space-y-3.5">
              <li>
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="text-primary/50 hover:text-accent text-sm transition-colors duration-200 flex items-start gap-2.5"
                >
                  <Phone className="w-4 h-4 text-accent/60 mt-0.5 shrink-0" />
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-primary/50 hover:text-accent text-sm transition-colors duration-200 flex items-start gap-2.5"
                >
                  <Mail className="w-4 h-4 text-accent/60 mt-0.5 shrink-0" />
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <div className="text-primary/50 text-sm flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-accent/60 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{siteConfig.address.full}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-200 pt-6 mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary/25 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} {siteConfig.fullName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-primary/25 hover:text-primary/50 text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-primary/25 hover:text-primary/50 text-xs transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
