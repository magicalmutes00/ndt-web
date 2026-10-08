import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Loader } from "./components/ui/Loader";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { useContent } from "./content/ContentProvider";

const HomePage = lazy(() => import("./pages/HomePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const PlacementsPage = lazy(() => import("./pages/PlacementsPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ApplyPage = lazy(() => import("./pages/ApplyPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

/**
 * The dashboard is a separate lazy entry point, so its code (and the whole
 * editor/form machinery) is never downloaded by public visitors.
 */
const AdminApp = lazy(() => import("./admin/AdminApp"));

const SUSPENSE_FALLBACK = (
  <div className="min-h-[80dvh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
  </div>
);

function PageLoader({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={SUSPENSE_FALLBACK}>{children}</Suspense>;
}

export default function App() {
  const content = useContent();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Reading content here is deliberate: it re-renders the tree once the store
  // hydrates (API, cache, static snapshot or compiled default), so the public
  // pages never paint placeholder copy.
  void content;

  return (
    <>
      {loading && <Loader />}
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            {/* The dashboard has its own chrome, so it stays outside <Layout>. */}
            <Route path="/admin/*" element={<PageLoader><AdminApp /></PageLoader>} />
            <Route element={<Layout />}>
              <Route path="/" element={<PageLoader><HomePage /></PageLoader>} />
              <Route path="/about" element={<PageLoader><AboutPage /></PageLoader>} />
              <Route path="/courses" element={<PageLoader><CoursesPage /></PageLoader>} />
              <Route path="/services" element={<PageLoader><ServicesPage /></PageLoader>} />
              <Route path="/placements" element={<PageLoader><PlacementsPage /></PageLoader>} />
              <Route path="/gallery" element={<PageLoader><GalleryPage /></PageLoader>} />
              <Route path="/testimonials" element={<PageLoader><TestimonialsPage /></PageLoader>} />
              <Route path="/contact" element={<PageLoader><ContactPage /></PageLoader>} />
              <Route path="/apply" element={<PageLoader><ApplyPage /></PageLoader>} />
              <Route path="/privacy" element={<PageLoader><PrivacyPage /></PageLoader>} />
              <Route path="/terms" element={<PageLoader><TermsPage /></PageLoader>} />
              <Route path="*" element={<PageLoader><NotFoundPage /></PageLoader>} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </>
  );
}
