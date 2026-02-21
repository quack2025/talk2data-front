import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

type ForgotPasswordFormData = {
  email: string;
};

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
      toast.error(t.auth.error, {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Language selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector variant="outline" />
        </div>

        {/* Logo centered above the card */}
        <div className="flex justify-center mb-6">
          <img src="/genius-labs-logo.webp" alt="Talk2data" className="h-10 w-auto" />
        </div>

        {/* Card */}
        <Card className="shadow-md">
          {emailSent ? (
            <CardContent className="pt-6 space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">
                  {t.auth.checkYourEmail ?? "Revisa tu email"}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t.auth.resetLinkSent ?? "Hemos enviado un enlace de recuperación a"}{" "}
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
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>
                  {t.auth.forgotPasswordTitle ?? "¿Olvidaste tu contraseña?"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t.auth.forgotPasswordSubtitle ?? "Ingresa tu email y te enviaremos un enlace para recuperarla"}
                </p>
              </CardHeader>
              <CardContent>
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
                    className="w-full h-12 text-base"
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
              </CardContent>
            </>
          )}
        </Card>

        {/* Navigation link back to login */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.auth.backToLogin ?? "Volver al inicio de sesión"}
          </Link>
        </p>
      </div>
    </div>
  );
}
