import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

export function CTASection() {
  const { t } = useLanguage();
  const l = t.landing!;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-60" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{l.ctaTitle}</h2>
          <p className="text-muted-foreground text-lg mb-8">{l.ctaSubtitle}</p>
          <Button size="lg" className="text-base px-10 shadow-glow" asChild>
            <Link to="/auth">
              {l.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
