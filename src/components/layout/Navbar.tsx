"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { useContent } from "../../content/ContentProvider";
import { Button } from "../ui/Button";

export function Navbar() {
  const { settings, nav } = useContent();
  const navLinks = nav.links;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-white/80 backdrop-blur-2xl border-b border-surface-200"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between h-16 md:h-20 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-sm font-display">C</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-semibold text-sm tracking-tight text-primary">
              {settings.name}
            </span>
            <span className="hidden md:block text-[10px] text-primary/30 font-mono tracking-wider uppercase">
              {settings.tagline}
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-300",
                "hover:bg-surface-100",
                location.pathname === link.path
                  ? "text-accent"
                  : "text-primary/60 hover:text-primary"
              )}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-3 right-3 h-[2px] bg-accent rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            className="hidden md:inline-flex rounded-xl"
            asChild
          >
            <Link to="/contact">
              Apply Now
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-primary/60 hover:text-primary hover:bg-surface-100 transition-all"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden border-t border-surface-200 bg-white/95 backdrop-blur-2xl"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    location.pathname === link.path
                      ? "text-accent bg-accent/5"
                      : "text-primary/60 hover:text-primary hover:bg-surface-50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2">
                <Button variant="primary" size="md" className="w-full" asChild>
                  <Link to="/contact">
                    Apply Now
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
