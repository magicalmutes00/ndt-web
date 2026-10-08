import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SEO } from "../components/ui/SEO";
import { Button } from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-surface">
      <SEO title="Page Not Found" description="The page you are looking for does not exist." path="" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center px-4"
      >
        <div className="font-display text-[10rem] md:text-[16rem] font-bold gradient-text leading-none mb-4">
          404
        </div>
        <p className="text-primary/50 text-lg max-w-md mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button variant="accent" size="lg" asChild>
          <Link to="/">
            Back to Home
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
