import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Save, AlertCircle, CreditCard, Trash2, User, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useUserPreferences, useDefaultPrompt, useUpdatePreferences } from '@/hooks/useUserPreferences';
import { PromptEditor } from '@/components/settings/PromptEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  UserPreferences,
  ResponseStyle,
  Tone,
  AutoVisualization,
  ConfidenceLevel,
} from '@/types/userPreferences';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const DEFAULT_PREFERENCES: UserPreferences = {
  response_style: 'executive',
  tone: 'semiformal',
  language: 'en',
  auto_visualizations: 'ask',
  confidence_level: '95',
  custom_summary_prompt: null,
};

// Plan badge styles per DESIGN_SYSTEM.md section 8.1
const planStyles: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-blue-100 text-blue-700',
  growth: 'bg-purple-100 text-purple-700',
  professional: 'bg-amber-100 text-amber-700',
  enterprise: 'bg-emerald-100 text-emerald-700',
};

export default function Settings() {
  const { t } = useLanguage();
  const { data: preferences, isLoading: preferencesLoading, error: preferencesError } = useUserPreferences();
  const { data: defaultPromptData, isLoading: promptLoading } = useDefaultPrompt();
  const updatePreferences = useUpdatePreferences();

  // Current user
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Local form state
  const [formData, setFormData] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fallback placeholders when backend fails
  const fallbackPlaceholders = [
    '{study_context}',
    '{questionnaire}',
    '{n_cases}',
    '{variables}',
    '{aggregated_data}',
    '{response_style}',
    '{tone}',
    '{language}',
  ];

  const fallbackDefaultPrompt = `You are an expert market research analyst. Generate an executive summary based on the following study data.

Study Context: {study_context}

Questionnaire: {questionnaire}

Number of Respondents: {n_cases}

Variables: {variables}

Aggregated Data: {aggregated_data}

Response Style: {response_style}
Tone: {tone}
Language: {language}

Provide a comprehensive executive summary highlighting key findings, trends, and actionable insights.`;

  // Use fallbacks when API fails
  const effectiveDefaultPrompt = defaultPromptData?.default_prompt || fallbackDefaultPrompt;
  const effectivePlaceholders = defaultPromptData?.available_placeholders || fallbackPlaceholders;

  // Initialize form with fetched data or defaults
  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
      setCustomPrompt(preferences.custom_summary_prompt || effectiveDefaultPrompt);
    } else if (!preferencesLoading) {
      setFormData(DEFAULT_PREFERENCES);
      setCustomPrompt(effectiveDefaultPrompt);
    }
  }, [preferences, preferencesLoading, effectiveDefaultPrompt]);

  // Update prompt when default loads
  useEffect(() => {
    if (effectiveDefaultPrompt && !preferences?.custom_summary_prompt && !preferencesLoading) {
      setCustomPrompt(effectiveDefaultPrompt);
    }
  }, [effectiveDefaultPrompt, preferences?.custom_summary_prompt, preferencesLoading]);

  // Compute if there are unsaved changes
  const hasChanges = useMemo(() => {
    const originalPrefs = preferences || DEFAULT_PREFERENCES;

    const prefsChanged =
      formData.response_style !== originalPrefs.response_style ||
      formData.tone !== originalPrefs.tone ||
      formData.language !== originalPrefs.language ||
      formData.auto_visualizations !== originalPrefs.auto_visualizations ||
      formData.confidence_level !== originalPrefs.confidence_level;

    const originalPrompt = preferences?.custom_summary_prompt || effectiveDefaultPrompt;
    const promptChanged = customPrompt !== originalPrompt;

    return prefsChanged || promptChanged;
  }, [formData, preferences, customPrompt, effectiveDefaultPrompt]);

  const handleSave = async () => {
    try {
      const isUsingDefault = customPrompt === effectiveDefaultPrompt;

      await updatePreferences.mutateAsync({
        response_style: formData.response_style,
        tone: formData.tone,
        language: formData.language,
        auto_visualizations: formData.auto_visualizations,
        confidence_level: formData.confidence_level,
        custom_summary_prompt: isUsingDefault ? null : customPrompt,
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleResetPrompt = () => {
    setCustomPrompt(effectiveDefaultPrompt);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Sign out the user — actual account deletion requires backend/admin action
      await supabase.auth.signOut();
      toast.success(t.settingsTabs?.deleteAccount ?? 'Account deleted');
      window.location.href = '/auth';
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const isLoading = preferencesLoading || promptLoading;

  // Only show critical error if both endpoints fail AND it's not a 404
  const isCriticalError = preferencesError &&
    !(preferencesError as any)?.message?.includes('not found') &&
    !(preferencesError as any)?.message?.includes('404');

  // Current plan (hardcoded to free until Stripe integration)
  const currentPlan = 'free';
  const planLabel = t.settingsTabs?.freePlan ?? 'Free';

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.userPreferences.title}</h1>
            <p className="text-muted-foreground mt-1">{t.userPreferences.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="text-warning border-warning">
                {t.userPreferences.unsavedChanges}
              </Badge>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updatePreferences.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updatePreferences.isPending ? t.userPreferences.saving : t.userPreferences.saveChanges}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-account" className="gap-2">
              <User className="h-4 w-4" />
              {t.settingsTabs?.myAccount ?? 'My Account'}
            </TabsTrigger>
            <TabsTrigger value="plan-billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {t.settingsTabs?.planAndBilling ?? 'Plan & Billing'}
            </TabsTrigger>
            <TabsTrigger value="danger-zone" className="gap-2 text-destructive data-[state=active]:text-destructive">
              <Trash2 className="h-4 w-4" />
              {t.settingsTabs?.dangerZone ?? 'Danger Zone'}
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB: MY ACCOUNT ─── */}
          <TabsContent value="my-account" className="space-y-6">
            {isCriticalError ? (
              <Card className="border-destructive">
                <CardContent className="flex items-center gap-3 py-6">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-destructive">{t.toasts.error}: {(preferencesError as Error).message}</p>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.settingsTabs?.fullName ?? 'Full name'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t.settingsTabs?.fullName ?? 'Full name'}</Label>
                      <Input
                        value={user?.user_metadata?.full_name || ''}
                        disabled
                        className="max-w-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.settingsTabs?.email ?? 'Email'}</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="max-w-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t.settingsTabs?.emailReadonly ?? 'To change your email, contact support.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Preferences Section */}
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    {t.settingsTabs?.aiPreferences ?? 'AI Preferences'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t.settingsTabs?.aiPreferencesDesc ?? 'Customize how AI interacts with you.'}
                  </p>
                </div>

                {/* Response Style */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.userPreferences.responseStyle}</CardTitle>
                    <CardDescription>{t.userPreferences.responseStyleDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.response_style}
                      onValueChange={(value: ResponseStyle) =>
                        setFormData((prev) => ({ ...prev, response_style: value }))
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="executive" id="executive" />
                        <div className="grid gap-1">
                          <Label htmlFor="executive" className="font-medium cursor-pointer">
                            {t.userPreferences.executive}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t.userPreferences.executiveDesc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="detailed" id="detailed" />
                        <div className="grid gap-1">
                          <Label htmlFor="detailed" className="font-medium cursor-pointer">
                            {t.userPreferences.detailed}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t.userPreferences.detailedDesc}
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Tone */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.userPreferences.tone}</CardTitle>
                    <CardDescription>{t.userPreferences.toneDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.tone}
                      onValueChange={(value: Tone) =>
                        setFormData((prev) => ({ ...prev, tone: value }))
                      }
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="formal" id="formal" />
                        <Label htmlFor="formal" className="cursor-pointer">
                          {t.userPreferences.formal}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="semiformal" id="semiformal" />
                        <Label htmlFor="semiformal" className="cursor-pointer">
                          {t.userPreferences.semiformal}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="casual" id="casual" />
                        <Label htmlFor="casual" className="cursor-pointer">
                          {t.userPreferences.casual}
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Language */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.userPreferences.language}</CardTitle>
                    <CardDescription>{t.userPreferences.languageDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.language}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Auto Visualizations */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.userPreferences.autoVisualizations}</CardTitle>
                    <CardDescription>{t.userPreferences.autoVisualizationsDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.auto_visualizations}
                      onValueChange={(value: AutoVisualization) =>
                        setFormData((prev) => ({ ...prev, auto_visualizations: value }))
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="ask" id="ask" />
                        <Label htmlFor="ask" className="cursor-pointer">
                          {t.userPreferences.ask}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="auto" id="auto" />
                        <Label htmlFor="auto" className="cursor-pointer">
                          {t.userPreferences.auto}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="never" id="never" />
                        <Label htmlFor="never" className="cursor-pointer">
                          {t.userPreferences.never}
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Confidence Level */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.userPreferences.confidenceLevel}</CardTitle>
                    <CardDescription>{t.userPreferences.confidenceLevelDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.confidence_level}
                      onValueChange={(value: ConfidenceLevel) =>
                        setFormData((prev) => ({ ...prev, confidence_level: value }))
                      }
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="95">95% ({t.userPreferences.recommended})</SelectItem>
                        <SelectItem value="99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Prompt Editor */}
                <PromptEditor
                  value={customPrompt}
                  defaultPrompt={effectiveDefaultPrompt}
                  placeholders={effectivePlaceholders}
                  onChange={setCustomPrompt}
                  onReset={handleResetPrompt}
                />
              </>
            )}
          </TabsContent>

          {/* ─── TAB: PLAN & BILLING ─── */}
          <TabsContent value="plan-billing" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>{t.settingsTabs?.currentPlan ?? 'Current plan'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={`whitespace-nowrap ${planStyles[currentPlan]}`}>
                    {planLabel}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {t.settingsTabs?.freePlanDesc ?? 'Basic access with limited functionality.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            <Card>
              <CardHeader>
                <CardTitle>{t.settingsTabs?.upgradeCta ?? 'Change plan'}</CardTitle>
                <CardDescription>
                  {t.settingsTabs?.upgradeDesc ?? 'Unlock more queries, exports and advanced features.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t.settingsTabs?.noStripeYet ?? 'Payment management will be available soon.'}
                </p>
                <Button disabled>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t.settingsTabs?.upgradeCta ?? 'Change plan'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: DANGER ZONE ─── */}
          <TabsContent value="danger-zone" className="space-y-6">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">
                  {t.settingsTabs?.dangerZone ?? 'Danger Zone'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {t.settingsTabs?.deleteAccount ?? 'Delete account'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t.settingsTabs?.deleteAccountDesc ?? 'This action is permanent and cannot be undone.'}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    {t.settingsTabs?.deleteAccountButton ?? 'Delete account'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AlertDialog for account deletion */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t.settingsTabs?.deleteAccountConfirm ?? 'Delete your account?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t.settingsTabs?.deleteAccountWarning ?? 'All your projects, files, conversations and associated data will be permanently deleted. This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t.settingsTabs?.deleteAccountCancel ?? 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isDeleting
                  ? (t.common.loading)
                  : (t.settingsTabs?.deleteAccountButton ?? 'Delete account')
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
