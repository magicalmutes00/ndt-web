import { SEO } from "../components/ui/SEO";
import { Gallery } from "../components/ui/Gallery";

export default function GalleryPage() {
  return (
    <div className="pt-24 md:pt-28 bg-surface-50">
      <SEO title="Gallery" path="/gallery" />
      <section className="relative py-24 overflow-hidden">
        <div className="noise-bg absolute inset-0" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <Gallery variant="page" title="Our" highlight="Gallery" />
        </div>
      </section>
    </div>
  );
}
