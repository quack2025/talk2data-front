import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import logoImage from "@/assets/logo.png";

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Supabase sets the session automatically when user clicks reset link
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    // Also check if user is already in a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const schema = z.object({
    password: z.string().min(6, t.auth.passwordMinLength),
    confirmPassword: z.string().min(6, t.auth.passwordMinLength),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t.auth.passwordsMustMatch ?? "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) throw error;
      setIsSuccess(true);
      setTimeout(() => navigate("/projects"), 3000);
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
        <div className="absolute top-4 right-4">
          <LanguageSelector variant="outline" />
        </div>

        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Survey Genius" className="h-10 w-auto" />
          </div>

          {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold">
                  {t.auth.passwordUpdated ?? "¡Contraseña actualizada!"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {t.auth.redirectingToProjects ?? "Redirigiendo a tus proyectos..."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="font-heading text-3xl font-bold">
                  {t.auth.resetPasswordTitle ?? "Crea una nueva contraseña"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {t.auth.resetPasswordSubtitle ?? "Ingresa y confirma tu nueva contraseña"}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth.password}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t.auth.passwordPlaceholder}
                      className="pl-10 pr-10 h-12"
                      {...register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t.auth.confirmPassword ?? "Confirmar contraseña"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder={t.auth.passwordPlaceholder}
                      className="pl-10 pr-10 h-12"
                      {...register("confirmPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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
                      {t.auth.updatePassword ?? "Actualizar contraseña"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
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
