import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutTemplate,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { PrepTemplate, TemplatesListResponse, ApplyTemplateResponse } from '@/types/dataPrep';
import { toast } from 'sonner';

interface TemplateSelectorProps {
  projectId: string;
  getTemplates: () => Promise<TemplatesListResponse>;
  applyTemplate: (templateId: string, mapping?: Record<string, string>) => Promise<ApplyTemplateResponse>;
}

const STUDY_COLORS: Record<string, string> = {
  nps: 'bg-emerald-100 text-emerald-700',
  brand_tracking: 'bg-blue-100 text-blue-700',
  concept_test: 'bg-violet-100 text-violet-700',
  ua: 'bg-orange-100 text-orange-700',
};

export function TemplateSelector({
  projectId,
  getTemplates,
  applyTemplate,
}: TemplateSelectorProps) {
  const { t } = useLanguage();
  const dpT = t.dataPrep as any;

  const [templates, setTemplates] = useState<PrepTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await getTemplates();
        setTemplates(res.templates);
      } catch {
        // handled by parent
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleApply = async (template: PrepTemplate) => {
    setApplyingId(template.id);
    try {
      const res = await applyTemplate(template.id);
      toast.success(
        dpT?.templateApplied
          ? `${template.name}: ${res.rules_created} ${dpT.templateApplied}`
          : `${template.name}: ${res.rules_created} rules created`
      );
      if (res.unmapped.length > 0) {
        toast.warning(
          dpT?.templateUnmapped
            ? `${dpT.templateUnmapped}: ${res.unmapped.join(', ')}`
            : `Unmapped variables: ${res.unmapped.join(', ')}`
        );
      }
      if (res.warnings?.length) {
        res.warnings.forEach((w: string) => toast.warning(w));
      }
    } catch {
      toast.error(dpT?.templateError || 'Error applying template');
    } finally {
      setApplyingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <LayoutTemplate className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {dpT?.templateTitle || 'Study Templates'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((tmpl) => (
          <Card key={tmpl.id} className="hover:border-primary/40 transition-colors">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{tmpl.name}</CardTitle>
                <Badge className={`text-xs ${STUDY_COLORS[tmpl.study_type] || 'bg-gray-100 text-gray-700'}`}>
                  {tmpl.study_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 px-4">
              <p className="text-xs text-muted-foreground mb-2">{tmpl.description}</p>

              {/* Rules preview */}
              <ul className="space-y-1 mb-3">
                {tmpl.rules_preview.map((rule, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>

              {/* Required variables */}
              <div className="flex flex-wrap gap-1 mb-3">
                {tmpl.required_variables.map((rv) => (
                  <Badge
                    key={rv.key}
                    variant="outline"
                    className={`text-xs ${rv.required ? '' : 'opacity-60'}`}
                  >
                    {rv.label.split('(')[0].trim()}
                    {!rv.required && ' ?'}
                  </Badge>
                ))}
              </div>

              <Button
                size="sm"
                className="w-full"
                disabled={applyingId === tmpl.id}
                onClick={() => handleApply(tmpl)}
              >
                {applyingId === tmpl.id ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                )}
                {dpT?.applyTemplate || 'Apply template'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
