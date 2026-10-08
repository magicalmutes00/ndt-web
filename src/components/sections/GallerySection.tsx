"use client";

import { Gallery } from "../ui/Gallery";

/** Homepage gallery section. Shares its implementation with /gallery. */
export function GallerySection() {
  return (
    <section id="gallery" className="relative py-24 md:py-32 overflow-hidden bg-surface-50">
      <div className="noise-bg absolute inset-0" />
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <Gallery variant="section" title="Our" highlight="Facilities" />
      </div>
    </section>
  );
}
