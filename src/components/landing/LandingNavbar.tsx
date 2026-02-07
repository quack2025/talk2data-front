import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export function LandingNavbar() {
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold text-foreground">
            Survey Genius
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Button variant="ghost" asChild>
            <Link to="/auth">{t.landing?.login || "Iniciar sesión"}</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">{t.landing?.cta || "Empieza gratis"}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
