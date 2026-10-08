import { SEO } from "../components/ui/SEO";
import { HeroSection } from "../components/sections/HeroSection";
import { AboutSection } from "../components/sections/AboutSection";
import { CoursesSection } from "../components/sections/CoursesSection";
import { TrainingFlowSection } from "../components/sections/TrainingFlowSection";
import { EquipmentSection } from "../components/sections/EquipmentSection";
import { PlacementSection } from "../components/sections/PlacementSection";
import { GallerySection } from "../components/sections/GallerySection";
import { TestimonialsSection } from "../components/sections/TestimonialsSection";
import { ContactSection } from "../components/sections/ContactSection";

export default function HomePage() {
  return (
    <>
      <SEO title="Home" description="Premier NDT training institute in Example City. ASNT Level II certified training with 100% placement assistance in Oil & Gas, Offshore & Shipyard." path="/" />
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <TrainingFlowSection />
      <EquipmentSection />
      <PlacementSection />
      <GallerySection />
      <TestimonialsSection />
      <ContactSection />
    </>
  );
}
