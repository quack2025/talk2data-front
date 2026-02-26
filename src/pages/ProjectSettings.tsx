import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Loader2, Save, Trash2, ChevronDown, X, CalendarIcon, Users } from 'lucide-react';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useTeams, useAssignProjectToTeam } from '@/hooks/useTeams';
import { useLanguage } from '@/i18n/LanguageContext';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ProjectUpdateData } from '@/types/database';

const INDUSTRIES = [
  'FMCG',
  'Automotive',
  'Banking',
  'Telecom',
  'Pharma',
  'Retail',
  'Technology',
  'Media',
  'Healthcare',
  'Other',
];

const METHODOLOGIES = [
  'Online panel',
  'CATI',
  'Face-to-face',
  'Focus groups',
  'In-depth interviews',
  'Mixed methods',
  'Other',
];

export default function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const { data: project, isLoading } = useProject(projectId!);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { data: teams } = useTeams();
  const assignToTeam = useAssignProjectToTeam();

  const [isContextOpen, setIsContextOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Basic fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Study context fields
  const [studyObjective, setStudyObjective] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');
  const [methodology, setMethodology] = useState('');
  const [studyDate, setStudyDate] = useState<Date | undefined>();
  const [isTracking, setIsTracking] = useState(false);
  const [waveNumber, setWaveNumber] = useState<number | undefined>();
  const [additionalContext, setAdditionalContext] = useState('');
  const [reportLanguage, setReportLanguage] = useState('en');

  // Initialize form when project loads
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setStudyObjective(project.study_objective || '');
      setCountry(project.country || '');
      setIndustry(project.industry || '');
      setTargetAudience(project.target_audience || '');
      setBrands(project.brands || []);
      setMethodology(project.methodology || '');
      setStudyDate(project.study_date ? new Date(project.study_date) : undefined);
      setIsTracking(project.is_tracking || false);
      setWaveNumber(project.wave_number);
      setAdditionalContext(project.additional_context || '');
      setReportLanguage(project.report_language || 'en');
      
      // Open context section if any context field has data
      const hasContextData = project.study_objective || project.country || 
        project.industry || project.target_audience || 
        (project.brands && project.brands.length > 0) || 
        project.methodology || project.study_date || project.is_tracking;
      setIsContextOpen(!!hasContextData);
    }
  }, [project]);

  const markChanged = () => setHasChanges(true);

  const handleAddBrand = () => {
    const trimmed = brandInput.trim();
    if (trimmed && !brands.includes(trimmed)) {
      setBrands([...brands, trimmed]);
      setBrandInput('');
      markChanged();
    }
  };

  const handleRemoveBrand = (brand: string) => {
    setBrands(brands.filter(b => b !== brand));
    markChanged();
  };

  const handleBrandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBrand();
    }
  };

  const handleSave = async () => {
    if (!projectId) return;
    
    const data: ProjectUpdateData = {
      name,
      description: description || undefined,
      study_objective: studyObjective || undefined,
      country: country || undefined,
      industry: industry || undefined,
      target_audience: targetAudience || undefined,
      brands: brands.length > 0 ? brands : undefined,
      methodology: methodology || undefined,
      study_date: studyDate ? format(studyDate, 'yyyy-MM-dd') : undefined,
      is_tracking: isTracking,
      wave_number: isTracking && waveNumber ? waveNumber : undefined,
      additional_context: additionalContext || undefined,
      report_language: reportLanguage,
    };

    try {
      await updateProject.mutateAsync({
        projectId,
        data,
        toastMessages: {
          success: t.toasts.projectUpdated,
          error: t.toasts.error,
        },
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    
    try {
      await deleteProject.mutateAsync({
        projectId,
        toastMessages: {
          success: t.toasts.projectDeleted,
          error: t.toasts.error,
        },
      });
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const dateLocale = language === 'es' ? es : enUS;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="p-4 md:p-8 text-center">
          <h1 className="text-2xl font-bold">{t.projectDetail.notFound}</h1>
          <Button
            variant="link"
            onClick={() => navigate('/projects')}
            className="mt-4"
          >
            {t.projectDetail.backToProjects}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-2xl">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">{t.projects.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}`}>{project.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t.projectDetail.settingsCard}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Button>

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t.projectDetail.settingsCard}</CardTitle>
            <CardDescription>{t.projectDetail.settingsCardDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.projects.name} *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); markChanged(); }}
                  placeholder={t.projects.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t.projects.description}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markChanged(); }}
                  placeholder={t.projects.description}
                  rows={3}
                />
              </div>
            </div>

            {/* Step 2: Study Context (Collapsible) */}
            <Collapsible open={isContextOpen} onOpenChange={setIsContextOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <span className="text-sm font-medium">{t.settings.studyContext}</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isContextOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Study Objective */}
                <div className="space-y-2">
                  <Label htmlFor="studyObjective">{t.settings.studyObjective}</Label>
                  <Textarea
                    id="studyObjective"
                    value={studyObjective}
                    onChange={(e) => { setStudyObjective(e.target.value); markChanged(); }}
                    placeholder={t.settings.studyObjectivePlaceholder}
                    rows={3}
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">{t.settings.country}</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); markChanged(); }}
                    placeholder={t.settings.countryPlaceholder}
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label>{t.settings.industry}</Label>
                  <Select value={industry} onValueChange={(v) => { setIndustry(v); markChanged(); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.settings.industryPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">{t.settings.targetAudience}</Label>
                  <Textarea
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => { setTargetAudience(e.target.value); markChanged(); }}
                    placeholder={t.settings.targetAudiencePlaceholder}
                    rows={2}
                  />
                </div>

                {/* Brands */}
                <div className="space-y-2">
                  <Label>{t.settings.brands}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={brandInput}
                      onChange={(e) => setBrandInput(e.target.value)}
                      onKeyDown={handleBrandKeyDown}
                      placeholder={t.settings.brandsPlaceholder}
                    />
                    <Button type="button" variant="secondary" onClick={handleAddBrand}>
                      {t.common.add}
                    </Button>
                  </div>
                  {brands.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {brands.map((brand) => (
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

                {/* Methodology */}
                <div className="space-y-2">
                  <Label>{t.settings.methodology}</Label>
                  <Select value={methodology} onValueChange={(v) => { setMethodology(v); markChanged(); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.settings.methodologyPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODOLOGIES.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Study Date */}
                <div className="space-y-2">
                  <Label>{t.settings.studyDate}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !studyDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {studyDate ? format(studyDate, 'PPP', { locale: dateLocale }) : t.settings.studyDatePlaceholder}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={studyDate}
                        onSelect={(date) => { setStudyDate(date); markChanged(); }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Is Tracking */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="isTracking">{t.settings.isTracking}</Label>
                  <Switch
                    id="isTracking"
                    checked={isTracking}
                    onCheckedChange={(checked) => { setIsTracking(checked); markChanged(); }}
                  />
                </div>

                {/* Wave Number (visible if tracking) */}
                {isTracking && (
                  <div className="space-y-2">
                    <Label htmlFor="waveNumber">{t.settings.waveNumber}</Label>
                    <Input
                      id="waveNumber"
                      type="number"
                      min={1}
                      value={waveNumber || ''}
                      onChange={(e) => { setWaveNumber(e.target.value ? parseInt(e.target.value) : undefined); markChanged(); }}
                      placeholder={t.settings.waveNumberPlaceholder}
                    />
                  </div>
                )}

                {/* Additional Context */}
                <div className="space-y-2">
                  <Label htmlFor="additionalContext">{t.settings.additionalContext}</Label>
                  <Textarea
                    id="additionalContext"
                    value={additionalContext}
                    onChange={(e) => { setAdditionalContext(e.target.value); markChanged(); }}
                    placeholder={t.settings.additionalContextPlaceholder}
                    rows={3}
                  />
                </div>

                {/* Report Language */}
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Idioma del Reporte' : 'Report Language'}</Label>
                  <Select value={reportLanguage} onValueChange={(v) => { setReportLanguage(v); markChanged(); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'es' ? 'Selecciona idioma' : 'Select language'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="pt">🇧🇷 Português</SelectItem>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? 'Idioma en el que se generarán los reportes y análisis (independiente del idioma del estudio)'
                      : 'Language for generated reports and analysis (independent of study language)'}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateProject.isPending || !name.trim()}
              >
                {updateProject.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t.common.save}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Assignment */}
        {teams && teams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t.teams?.assignToTeam || 'Assign to team'}
              </CardTitle>
              <CardDescription>
                {language === 'es'
                  ? 'Asigna este proyecto a un equipo para que todos los miembros puedan acceder.'
                  : 'Assign this project to a team so all members can access it.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={project?.owner_type === 'team' ? String(project.owner_id) : '__personal__'}
                onValueChange={(value) => {
                  if (!projectId) return;
                  if (value === '__personal__') return; // Can't unassign for now
                  assignToTeam.mutate({ projectId, teamId: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? 'Selecciona un equipo' : 'Select a team'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__personal__">
                    {language === 'es' ? 'Personal (solo yo)' : 'Personal (only me)'}
                  </SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.member_count} {language === 'es' ? 'miembros' : 'members'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {project?.owner_type === 'team' && (
                <p className="text-sm text-muted-foreground">
                  {language === 'es'
                    ? 'Este proyecto es accesible por todos los miembros del equipo.'
                    : 'This project is accessible by all team members.'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">{t.settings.dangerZone}</CardTitle>
            <CardDescription>{t.settings.dangerZoneDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t.settings.deleteProject}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.settings.deleteProjectConfirm}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.settings.deleteProjectWarning}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteProject.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {t.common.delete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
