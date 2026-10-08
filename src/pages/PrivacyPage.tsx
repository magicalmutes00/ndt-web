import { motion } from "framer-motion";
import { SEO } from "../components/ui/SEO";
import { useContent } from "../content/ContentProvider";

export default function PrivacyPage() {
  const { settings: siteConfig } = useContent();

  return (
    <div className="pt-24 md:pt-28 bg-surface-50">
      <SEO title="Privacy Policy" description="NDT Institute & Services privacy policy — how we collect, use, and protect your personal information." path="/privacy" />
      <section className="relative py-24 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-display-md font-bold tracking-tight mb-6 text-primary">
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <div className="glass-card p-8 space-y-4 text-primary/50 text-sm leading-relaxed">
              <p>
                {siteConfig.fullName} respects your privacy. This privacy policy outlines how we collect, use, and protect your personal information.
              </p>
              <h3 className="text-primary font-medium text-base">Information We Collect</h3>
              <p>
                We collect information you provide when filling out forms, including your name, email address, phone number, and course preferences.
              </p>
              <h3 className="text-primary font-medium text-base">How We Use Your Information</h3>
              <p>
                We use your information to respond to inquiries, process applications, provide training information, and improve our services. We do not share your personal data with third parties without your consent.
              </p>
              <h3 className="text-primary font-medium text-base">Data Protection</h3>
              <p>
                We implement reasonable security measures to protect your data from unauthorized access, alteration, or disclosure.
              </p>
              <h3 className="text-primary font-medium text-base">Contact</h3>
              <p>
                For any privacy-related concerns, please contact us at{" "}
                <a href={`mailto:${siteConfig.email}`} className="text-accent hover:underline">{siteConfig.email}</a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
