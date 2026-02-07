import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const numericValue = parseInt(value.replace(/\D/g, ""));
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (!hasAnimated) return;
    const controls = animate(motionValue, numericValue, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [hasAnimated, numericValue, motionValue]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasAnimated(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v + suffix;
    });
    return unsubscribe;
  }, [rounded, suffix]);

  return <span ref={ref} className="text-4xl sm:text-5xl font-heading font-bold text-gradient">0{suffix}</span>;
}

export function MetricsSection() {
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
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{l.metricsTitle}</h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {l.metrics.map((metric: string, i: number) => {
            const [value, suffix, label] = metric.split("|");
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-xl border border-border bg-card"
              >
                <AnimatedCounter value={value} suffix={suffix} />
                <p className="text-muted-foreground text-sm mt-3">{label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
