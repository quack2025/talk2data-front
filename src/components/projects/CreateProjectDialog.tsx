import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/i18n/LanguageContext';
import { Loader2, CalendarIcon, X, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// G8 countries + Latin America + Other
const COUNTRIES: Record<string, { es: string; en: string }> = {
  US: { es: 'Estados Unidos', en: 'United States' },
  GB: { es: 'Reino Unido', en: 'United Kingdom' },
  FR: { es: 'Francia', en: 'France' },
  DE: { es: 'Alemania', en: 'Germany' },
  IT: { es: 'Italia', en: 'Italy' },
  CA: { es: 'Canadá', en: 'Canada' },
  JP: { es: 'Japón', en: 'Japan' },
  RU: { es: 'Rusia', en: 'Russia' },
  AR: { es: 'Argentina', en: 'Argentina' },
  BO: { es: 'Bolivia', en: 'Bolivia' },
  BR: { es: 'Brasil', en: 'Brazil' },
  CL: { es: 'Chile', en: 'Chile' },
  CO: { es: 'Colombia', en: 'Colombia' },
  CR: { es: 'Costa Rica', en: 'Costa Rica' },
  EC: { es: 'Ecuador', en: 'Ecuador' },
  SV: { es: 'El Salvador', en: 'El Salvador' },
  ES: { es: 'España', en: 'Spain' },
  GT: { es: 'Guatemala', en: 'Guatemala' },
  HN: { es: 'Honduras', en: 'Honduras' },
  MX: { es: 'México', en: 'Mexico' },
  NI: { es: 'Nicaragua', en: 'Nicaragua' },
  PA: { es: 'Panamá', en: 'Panama' },
  PY: { es: 'Paraguay', en: 'Paraguay' },
  PE: { es: 'Perú', en: 'Peru' },
  DO: { es: 'República Dominicana', en: 'Dominican Republic' },
  UY: { es: 'Uruguay', en: 'Uruguay' },
  VE: { es: 'Venezuela', en: 'Venezuela' },
  OTHER: { es: 'Otro', en: 'Other' },
};

const INDUSTRIES = [
  'FMCG', 'Automotive', 'Banking & Finance', 'Healthcare', 'Technology',
  'Retail', 'Telecom', 'Media & Entertainment', 'Travel & Hospitality',
  'Education', 'Government', 'Real Estate', 'Energy', 'Other'
];

const METHODOLOGIES = [
  'Online Survey', 'CATI', 'Face-to-face', 'Focus Groups', 
  'In-depth Interviews', 'Ethnography', 'Mixed Methods', 'Other'
];

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { createProject } = useProjects();
  const { t, language } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [brandInput, setBrandInput] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [showCustomCountry, setShowCustomCountry] = useState(false);
  
  const dateLocale = language === 'es' ? es : enUS;
  
  // Schema with required context fields in step 2
  const formSchema = z.object({
    // Step 1 - Basic Info
    name: z.string().min(1, t.createProject.nameLabel).max(100),
    description: z.string().max(500).optional(),
    // Step 2 - Study Context (required fields)
    study_objective: z.string().min(1, language === 'es' ? 'El objetivo es obligatorio' : 'Objective is required').max(1000),
    country: z.string().min(1, language === 'es' ? 'El país es obligatorio' : 'Country is required'),
    industry: z.string().min(1, language === 'es' ? 'La industria es obligatoria' : 'Industry is required'),
    target_audience: z.string().min(1, language === 'es' ? 'El público objetivo es obligatorio' : 'Target audience is required').max(500),
    // Optional context fields
    brands: z.array(z.string()).optional(),
    methodology: z.string().optional(),
    study_date: z.date().optional(),
    is_tracking: z.boolean().optional(),
    wave_number: z.number().min(1).optional(),
    additional_context: z.string().max(2000).optional(),
    report_language: z.string().default('en'),
  });

  type FormData = z.infer<typeof formSchema>;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      study_objective: '',
      country: '',
      industry: '',
      target_audience: '',
      brands: [],
      methodology: '',
      study_date: undefined,
      is_tracking: false,
      wave_number: undefined,
      additional_context: '',
      report_language: 'en',
    },
  });

  const isTracking = form.watch('is_tracking');
  const brands = form.watch('brands') || [];

  const handleAddBrand = () => {
    const trimmed = brandInput.trim();
    if (trimmed && !brands.includes(trimmed)) {
      form.setValue('brands', [...brands, trimmed]);
      setBrandInput('');
    }
  };

  const handleRemoveBrand = (brand: string) => {
    form.setValue('brands', brands.filter(b => b !== brand));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBrand();
    }
  };

  const handleNextStep = async () => {
    // Validate step 1 fields
    const isStep1Valid = await form.trigger(['name', 'description']);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const onSubmit = async (data: FormData) => {
    await createProject.mutateAsync({
      name: data.name,
      description: data.description,
      study_objective: data.study_objective,
      country: data.country,
      industry: data.industry,
      target_audience: data.target_audience,
      brands: data.brands?.length ? data.brands : undefined,
      methodology: data.methodology || undefined,
      study_date: data.study_date?.toISOString() || undefined,
      is_tracking: data.is_tracking || false,
      wave_number: data.is_tracking ? data.wave_number : undefined,
      additional_context: data.additional_context || undefined,
      report_language: data.report_language || 'en',
    });
    form.reset();
    setStep(1);
    setBrandInput('');
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setStep(1);
      setBrandInput('');
      setCustomCountry('');
      setShowCustomCountry(false);
    }
    onOpenChange(isOpen);
  };

  const stepTitles = {
    1: {
      title: t.createProject.title,
      description: t.createProject.description,
    },
    2: {
      title: language === 'es' ? 'Contexto del estudio' : 'Study Context',
      description: language === 'es' 
        ? 'Esta información es esencial para que la IA analice tus datos correctamente' 
        : 'This information is essential for AI to analyze your data correctly',
    },
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[90dvh] max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                step === 1 ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                step === 2 ? "bg-primary" : "bg-muted"
              )} />
            </div>
            <span className="text-xs text-muted-foreground">
              {language === 'es' ? `Paso ${step} de 2` : `Step ${step} of 2`}
            </span>
          </div>
          <DialogTitle>{stepTitles[step].title}</DialogTitle>
          <DialogDescription>
            {stepTitles[step].description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 gap-4">
            <ScrollArea type="always" className="flex-1 min-h-0">
              <div className="space-y-4 px-1 py-1 pr-4">
              
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.createProject.nameLabel} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.createProject.namePlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.createProject.descriptionLabel}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.createProject.descriptionPlaceholder}
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 2: Study Context */}
              {step === 2 && (
                <>
                  {/* Info banner */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' 
                        ? 'Los campos marcados con * son obligatorios para obtener análisis precisos de la IA.'
                        : 'Fields marked with * are required for accurate AI analysis.'}
                    </p>
                  </div>

                  {/* Study Objective */}
                  <FormField
                    control={form.control}
                    name="study_objective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.settings.studyObjective} *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.settings.studyObjectivePlaceholder}
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Country & Industry Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settings.country} *</FormLabel>
                          {showCustomCountry ? (
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder={language === 'es' ? 'Nombre del país' : 'Country name'}
                                  value={customCountry}
                                  onChange={(e) => {
                                    setCustomCountry(e.target.value);
                                    field.onChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setShowCustomCountry(false);
                                  setCustomCountry('');
                                  field.onChange('');
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Select 
                              onValueChange={(value) => {
                                if (value === 'OTHER') {
                                  setShowCustomCountry(true);
                                  field.onChange('');
                                } else {
                                  field.onChange(COUNTRIES[value][language]);
                                }
                              }} 
                              value={Object.keys(COUNTRIES).find(k => COUNTRIES[k][language] === field.value) || field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.settings.countryPlaceholder} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(COUNTRIES).map(([code, names]) => (
                                  <SelectItem key={code} value={code}>
                                    {names[language]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settings.industry} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t.settings.industryPlaceholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INDUSTRIES.map(industry => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Target Audience */}
                  <FormField
                    control={form.control}
                    name="target_audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.settings.targetAudience} *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.settings.targetAudiencePlaceholder}
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Brands */}
                  <FormField
                    control={form.control}
                    name="brands"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t.settings.brands}</FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder={t.settings.brandsPlaceholder}
                              value={brandInput}
                              onChange={(e) => setBrandInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="flex-1"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={handleAddBrand}
                            >
                              {t.common.add}
                            </Button>
                          </div>
                          {brands.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {brands.map(brand => (
                                <Badge key={brand} variant="secondary" className="gap-1">
                                  {brand}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBrand(brand)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Methodology & Date Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="methodology"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settings.methodology}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t.settings.methodologyPlaceholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {METHODOLOGIES.map(method => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="study_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settings.studyDate}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: dateLocale })
                                  ) : (
                                    <span>{t.settings.studyDatePlaceholder}</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tracking Toggle */}
                  <FormField
                    control={form.control}
                    name="is_tracking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{t.settings.isTracking}</FormLabel>
                          <FormDescription className="text-xs">
                            {language === 'es' ? 'Este proyecto forma parte de un tracking recurrente' : 'This project is part of a recurring tracking study'}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Wave Number (conditional) */}
                  {isTracking && (
                    <FormField
                      control={form.control}
                      name="wave_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settings.waveNumber}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder={t.settings.waveNumberPlaceholder}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Additional Context */}
                  <FormField
                    control={form.control}
                    name="additional_context"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.settings.additionalContext}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.settings.additionalContextPlaceholder}
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Report Language */}
                  <FormField
                    control={form.control}
                    name="report_language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'es' ? 'Idioma del Reporte' : 'Report Language'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'en'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={language === 'es' ? 'Selecciona idioma' : 'Select language'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="es">🇪🇸 Español</SelectItem>
                            <SelectItem value="en">🇺🇸 English</SelectItem>
                            <SelectItem value="pt">🇧🇷 Português</SelectItem>
                            <SelectItem value="fr">🇫🇷 Français</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          {language === 'es' 
                            ? 'Idioma en el que se generarán los reportes y análisis (independiente del idioma del estudio)'
                            : 'Language for generated reports and analysis (independent of study language)'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              </div>
            </ScrollArea>

            {/* Footer - fixed at bottom */}
            <DialogFooter className="pt-4 gap-2 shrink-0 border-t mt-auto">
              {step === 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClose(false)}
                  >
                    {t.createProject.cancel}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="gap-2"
                  >
                    {t.common.continue}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t.common.back}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProject.isPending}
                  >
                    {createProject.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t.createProject.creating}
                      </>
                    ) : (
                      t.createProject.create
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
