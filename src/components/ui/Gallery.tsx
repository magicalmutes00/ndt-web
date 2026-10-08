"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useContent } from "../../content/ContentProvider";
import { GalleryImage } from "./GalleryImage";

interface GalleryProps {
  /** "section" renders an h2 for the homepage; "page" renders an h1. */
  variant?: "section" | "page";
  title?: string;
  highlight?: string;
  showEyebrow?: boolean;
}

/**
 * Gallery grid with a lightbox, shared by the homepage section and /gallery.
 *
 * Previously these were two near-identical copies, and they had drifted: the
 * page version indexed the lightbox by position in the *filtered* list, so
 * switching category opened the wrong photo. One implementation removes that
 * class of bug entirely.
 */
export function Gallery({ variant = "section", title = "Our", highlight = "Facilities", showEyebrow = true }: GalleryProps) {
  const { collections } = useContent();
  const gallery = collections.gallery;
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  // Categories come from the data, so an admin can invent one without a code change.
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const item of gallery) {
      if (!seen.includes(item.category)) seen.push(item.category);
    }
    return ["All", ...seen];
  }, [gallery]);

  const filtered = useMemo(
    () => (activeCategory === "All" ? gallery : gallery.filter((item) => item.category === activeCategory)),
    [gallery, activeCategory]
  );

  const activeIndex = activeImageId ? filtered.findIndex((item) => item.id === activeImageId) : -1;
  const activeItem = activeIndex >= 0 ? filtered[activeIndex] : null;

  const step = (delta: number) => {
    if (activeIndex < 0) return;
    const next = (activeIndex + delta + filtered.length) % filtered.length;
    setActiveImageId(filtered[next]?.id ?? null);
  };

  const Heading = variant === "page" ? "h1" : "h2";
  const headingSize = variant === "page" ? "text-display-lg" : "text-display-md";

  return (
    <>
      <div className={variant === "page" ? "text-center mb-12" : "text-center mb-12"}>
        {showEyebrow && (
          <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
            Gallery
          </span>
        )}
        <Heading className={`font-display ${headingSize} font-bold tracking-tight mb-4 text-primary`}>
          {title} <span className="gradient-text">{highlight}</span>
        </Heading>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setActiveImageId(null);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeCategory === cat
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-primary/50 hover:text-primary/70 border border-transparent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setActiveImageId(item.id)}
              className="cursor-pointer break-inside-avoid rounded-2xl overflow-hidden group relative"
            >
              <div className="relative overflow-hidden rounded-2xl glass-card">
                <div className="aspect-[4/3]">
                  <GalleryImage src={item.src} alt={item.alt || item.title} category={item.category} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-white/70 text-xs">{item.category}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/80 backdrop-blur-2xl"
            onClick={() => setActiveImageId(null)}
          >
            <button
              onClick={(event) => {
                event.stopPropagation();
                setActiveImageId(null);
              }}
              aria-label="Close image viewer"
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              aria-label="Previous image"
              className="absolute left-6 w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              aria-label="Next image"
              className="absolute right-6 w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label={activeItem.title}
              className="max-w-4xl max-h-[80vh] w-full mx-4 rounded-3xl overflow-hidden glass-card"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="aspect-video">
                <GalleryImage
                  src={activeItem.src}
                  alt={activeItem.alt || activeItem.title}
                  category={activeItem.category}
                  priority
                />
              </div>
              <div className="p-5 bg-white/90">
                <p className="font-display font-semibold text-primary">{activeItem.title}</p>
                <p className="text-primary/50 text-sm">{activeItem.category}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
