import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

export function BeforeAfterSection() {
  const { t } = useLanguage();
  const l = t.landing!;

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{l.beforeAfterTitle}</h2>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-4">
          {l.beforeAfter.map((item: string, i: number) => {
            const [before, after] = item.split("|");
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col sm:flex-row items-stretch gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex-1 rounded-lg bg-destructive/5 border border-destructive/10 p-4">
                  <span className="text-xs font-bold text-destructive uppercase tracking-wider">{l.before}</span>
                  <p className="text-sm text-foreground mt-1">{before}</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary rotate-90 sm:rotate-0" />
                </div>
                <div className="flex-1 rounded-lg bg-success/5 border border-success/10 p-4">
                  <span className="text-xs font-bold text-success uppercase tracking-wider">{l.after}</span>
                  <p className="text-sm text-foreground mt-1">{after}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
