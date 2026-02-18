import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import logoImage from "@/assets/logo.png";

type ForgotPasswordFormData = {
  email: string;
};

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const schema = z.object({
    email: z.string().email(t.auth.invalidEmail),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setEmailSent(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t.auth.genericError;
      toast({
        title: t.auth.error,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        {/* Language selector */}
        <div className="absolute top-4 right-4">
          <LanguageSelector variant="outline" />
        </div>

        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Survey Genius" className="h-10 w-auto" />
          </div>

          {emailSent ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold">
                  {t.auth.checkYourEmail ?? "Revisa tu email"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {t.auth.resetLinkSent ?? `Hemos enviado un enlace de recuperación a`}{" "}
                  <span className="font-medium text-foreground">{getValues("email")}</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.auth.noEmailReceived ?? "¿No recibiste el email? Revisa tu carpeta de spam o"}
              </p>
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => setEmailSent(false)}
              >
                {t.auth.tryAgain ?? "Intentar de nuevo"}
              </Button>
              <Link
                to="/auth"
                className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.auth.backToLogin ?? "Volver al inicio de sesión"}
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="font-heading text-3xl font-bold">
                  {t.auth.forgotPasswordTitle ?? "¿Olvidaste tu contraseña?"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {t.auth.forgotPasswordSubtitle ?? "Ingresa tu email y te enviaremos un enlace para recuperarla"}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t.auth.emailPlaceholder}
                      className="pl-10 h-12"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-primary hover:opacity-90 shadow-glow transition-smooth"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {t.auth.sendResetLink ?? "Enviar enlace de recuperación"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <Link
                to="/auth"
                className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.auth.backToLogin ?? "Volver al inicio de sesión"}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-accent/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-primary-glow/30 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg text-center text-primary-foreground p-8">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-auto items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 animate-bounce-subtle p-4">
              <img src={logoImage} alt="Survey Genius" className="h-10 w-auto brightness-0 invert" />
            </div>
          </div>
          <h2 className="font-heading text-4xl font-bold mb-4">
            {t.hero.title}
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            {t.hero.description}
          </p>
        </div>
      </div>
    </div>
  );
}
