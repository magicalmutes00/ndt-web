import { motion } from "framer-motion";
import { SEO } from "../components/ui/SEO";
import { useContent } from "../content/ContentProvider";

export default function TermsPage() {
  const { settings: siteConfig } = useContent();

  return (
    <div className="pt-24 md:pt-28 bg-surface">
      <SEO title="Terms & Conditions" description="Terms and conditions for using the NDT Institute & Services website and services." path="/terms" />
      <section className="relative py-24 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-display-md font-bold tracking-tight mb-6 text-primary">
              Terms & <span className="gradient-text">Conditions</span>
            </h1>
            <div className="glass-card p-8 space-y-4 text-primary/50 text-sm leading-relaxed">
              <p>
                By accessing and using the {siteConfig.fullName} website and services, you agree to comply with these terms and conditions.
              </p>
              <h3 className="text-primary font-medium text-base">Services</h3>
              <p>
                {siteConfig.fullName} provides NDT training, certification, and manpower services. Course details, fees, and schedules are subject to change without prior notice.
              </p>
              <h3 className="text-primary font-medium text-base">Registration</h3>
              <p>
                Students must provide accurate information during registration. {siteConfig.fullName} reserves the right to cancel registrations if false information is provided.
              </p>
              <h3 className="text-primary font-medium text-base">Certification</h3>
              <p>
                Certification is awarded upon successful completion of training and passing required assessments. {siteConfig.fullName} follows ASNT and ISO standards for certification.
              </p>
              <h3 className="text-primary font-medium text-base">Placement Assistance</h3>
              <p>
                While we strive for 100% placement assistance, actual job placement depends on various factors including market conditions, candidate performance, and client requirements.
              </p>
              <h3 className="text-primary font-medium text-base">Liability</h3>
              <p>
                {siteConfig.fullName} is not liable for any indirect damages arising from the use of our services. Our liability is limited to the fees paid for the specific service.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
