import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

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
      setTimeout(() => navigate("/dashboard"), 3000);
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
          {isSuccess ? (
            <CardContent className="pt-6 space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">
                  {t.auth.passwordUpdated ?? "¡Contraseña actualizada!"}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t.auth.redirectingToProjects ?? "Redirigiendo a tus proyectos..."}
                </p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>
                  {t.auth.resetPasswordTitle ?? "Crea una nueva contraseña"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t.auth.resetPasswordSubtitle ?? "Ingresa y confirma tu nueva contraseña"}
                </p>
              </CardHeader>
              <CardContent>
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
                    className="w-full h-12 text-base"
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
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
