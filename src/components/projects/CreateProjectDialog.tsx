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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Loader2, ChevronDown, ChevronUp, CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 
  'Ecuador', 'El Salvador', 'España', 'Guatemala', 'Honduras', 'México', 
  'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana', 
  'Uruguay', 'Venezuela', 'Estados Unidos', 'Otro'
];

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
  const [contextOpen, setContextOpen] = useState(false);
  const [brandInput, setBrandInput] = useState('');
  
  const dateLocale = language === 'es' ? es : enUS;
  
  const formSchema = z.object({
    name: z.string().min(1, t.createProject.nameLabel).max(100),
    description: z.string().max(500).optional(),
    // Study context fields
    study_objective: z.string().max(1000).optional(),
    country: z.string().optional(),
    industry: z.string().optional(),
    target_audience: z.string().max(500).optional(),
    brands: z.array(z.string()).optional(),
    methodology: z.string().optional(),
    study_date: z.date().optional(),
    is_tracking: z.boolean().optional(),
    wave_number: z.number().min(1).optional(),
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

  const onSubmit = async (data: FormData) => {
    await createProject.mutateAsync({
      name: data.name,
      description: data.description,
      study_objective: data.study_objective || undefined,
      country: data.country || undefined,
      industry: data.industry || undefined,
      target_audience: data.target_audience || undefined,
      brands: data.brands?.length ? data.brands : undefined,
      methodology: data.methodology || undefined,
      study_date: data.study_date?.toISOString() || undefined,
      is_tracking: data.is_tracking || false,
      wave_number: data.is_tracking ? data.wave_number : undefined,
    });
    form.reset();
    setContextOpen(false);
    setBrandInput('');
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setContextOpen(false);
      setBrandInput('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.createProject.title}</DialogTitle>
          <DialogDescription>
            {t.createProject.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Basic Fields */}
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
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Study Context - Collapsible */}
              <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full justify-between px-3 py-2 h-auto border border-dashed border-border hover:border-primary/50"
                  >
                    <span className="text-sm font-medium">{t.settings.studyContext}</span>
                    {contextOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  {/* Study Objective */}
                  <FormField
                    control={form.control}
                    name="study_objective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.settings.studyObjective}</FormLabel>
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
                          <FormLabel>{t.settings.country}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t.settings.countryPlaceholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map(country => (
                                <SelectItem key={country} value={country}>
                                  {country}
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
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.settings.industry}</FormLabel>
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
                        <FormLabel>{t.settings.targetAudience}</FormLabel>
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
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CollapsibleContent>
              </Collapsible>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                >
                  {t.createProject.cancel}
                </Button>
                <Button type="submit" disabled={createProject.isPending}>
                  {createProject.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {createProject.isPending ? t.createProject.creating : t.createProject.create}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
