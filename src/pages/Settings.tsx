import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Save, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useUserPreferences, useDefaultPrompt, useUpdatePreferences } from '@/hooks/useUserPreferences';
import { PromptEditor } from '@/components/settings/PromptEditor';
import {
  UserPreferences,
  ResponseStyle,
  Tone,
  AutoVisualization,
  ConfidenceLevel,
} from '@/types/userPreferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  response_style: 'executive',
  tone: 'semiformal',
  language: 'en',
  auto_visualizations: 'ask',
  confidence_level: '95',
  custom_summary_prompt: null,
};

export default function Settings() {
  const { t } = useLanguage();
  const { data: preferences, isLoading: preferencesLoading, error: preferencesError } = useUserPreferences();
  const { data: defaultPromptData, isLoading: promptLoading } = useDefaultPrompt();
  const updatePreferences = useUpdatePreferences();

  // Local form state
  const [formData, setFormData] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Initialize form with fetched data
  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
      setCustomPrompt(preferences.custom_summary_prompt || defaultPromptData?.default_prompt || '');
    }
  }, [preferences, defaultPromptData]);

  // Update prompt when default loads
  useEffect(() => {
    if (defaultPromptData && !preferences?.custom_summary_prompt) {
      setCustomPrompt(defaultPromptData.default_prompt);
    }
  }, [defaultPromptData, preferences?.custom_summary_prompt]);

  // Compute if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!preferences) return false;

    const prefsChanged =
      formData.response_style !== preferences.response_style ||
      formData.tone !== preferences.tone ||
      formData.language !== preferences.language ||
      formData.auto_visualizations !== preferences.auto_visualizations ||
      formData.confidence_level !== preferences.confidence_level;

    const originalPrompt = preferences.custom_summary_prompt || defaultPromptData?.default_prompt || '';
    const promptChanged = customPrompt !== originalPrompt;

    return prefsChanged || promptChanged;
  }, [formData, preferences, customPrompt, defaultPromptData]);

  const handleSave = () => {
    const isUsingDefault = customPrompt === defaultPromptData?.default_prompt;
    
    updatePreferences.mutate({
      response_style: formData.response_style,
      tone: formData.tone,
      language: formData.language,
      auto_visualizations: formData.auto_visualizations,
      confidence_level: formData.confidence_level,
      custom_summary_prompt: isUsingDefault ? null : customPrompt,
    });
  };

  const handleResetPrompt = () => {
    if (defaultPromptData) {
      setCustomPrompt(defaultPromptData.default_prompt);
    }
  };

  const isLoading = preferencesLoading || promptLoading;

  if (preferencesError) {
    return (
      <AppLayout>
        <div className="container max-w-4xl py-8">
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{t.toasts.error}: {(preferencesError as Error).message}</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.userPreferences.title}</h1>
            <p className="text-muted-foreground mt-1">{t.userPreferences.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
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

        {isLoading ? (
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
          <div className="space-y-6">
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
            {defaultPromptData && (
              <PromptEditor
                value={customPrompt}
                defaultPrompt={defaultPromptData.default_prompt}
                placeholders={defaultPromptData.available_placeholders}
                onChange={setCustomPrompt}
                onReset={handleResetPrompt}
              />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
