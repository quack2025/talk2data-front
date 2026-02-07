import { Upload, MessageSquare, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const stepIcons = [Upload, MessageSquare, FileDown];

export function HowItWorksSection() {
  const { t } = useLanguage();
  const l = t.landing!;

  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{l.howTitle}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{l.howSubtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          {l.howSteps.map((step: string, i: number) => {
            const Icon = stepIcons[i];
            const [title, desc] = step.split("|");
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow relative z-10">
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-primary mb-2 block uppercase tracking-wider">
                  {l.step} {i + 1}
                </span>
                <h3 className="font-heading text-xl font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
