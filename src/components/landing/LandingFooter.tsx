import { useLanguage } from "@/i18n/LanguageContext";

export function LandingFooter() {
  const { t } = useLanguage();
  const l = t.landing!;

  return (
    <footer className="border-t border-border py-12 bg-card">
      <div className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-heading text-lg font-bold text-foreground">Survey Genius</span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-smooth">{l.footerProduct}</a>
            <a
              href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-smooth"
            >
              API
            </a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Survey Genius</p>
        </div>
      </div>
    </footer>
  );
}
