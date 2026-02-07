import { Clock, Table2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const icons = [Clock, Table2, FileText];

export function PainPointsSection() {
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
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{l.painTitle}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{l.painSubtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {l.painPoints.map((point: string, i: number) => {
            const Icon = icons[i];
            const [title, desc] = point.split("|");
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
                  <Icon className="h-7 w-7 text-destructive" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
