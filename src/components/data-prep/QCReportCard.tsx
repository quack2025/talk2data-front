import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { QCReportResponse, QCCheckResult } from '@/types/dataPrep';

interface QCReportCardProps {
  projectId: string;
  getQCReport: () => Promise<QCReportResponse>;
}

const STATUS_CONFIG: Record<string, { icon: typeof ShieldCheck; color: string; bg: string }> = {
  ok: { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
  warning: { icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
  critical: { icon: ShieldX, color: 'text-red-600', bg: 'bg-red-50' },
};

const QUALITY_CONFIG: Record<string, { label: { es: string; en: string }; color: string }> = {
  good: { label: { es: 'Buena', en: 'Good' }, color: 'bg-green-100 text-green-700' },
  acceptable: { label: { es: 'Aceptable', en: 'Acceptable' }, color: 'bg-amber-100 text-amber-700' },
  poor: { label: { es: 'Deficiente', en: 'Poor' }, color: 'bg-red-100 text-red-700' },
};

const CHECK_LABELS: Record<string, { es: string; en: string }> = {
  speeders: { es: 'Speeders', en: 'Speeders' },
  straightliners: { es: 'Straightliners', en: 'Straightliners' },
  high_missing: { es: 'Alto % missing', en: 'High missing' },
  out_of_range: { es: 'Fuera de rango', en: 'Out of range' },
};

export function QCReportCard({ projectId, getQCReport }: QCReportCardProps) {
  const { t, language } = useLanguage();
  const dpT = t.dataPrep as any;
  const lang = language as 'es' | 'en';

  const [report, setReport] = useState<QCReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await getQCReport();
      setReport(res);
    } catch {
      // handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          {dpT?.runningQC || 'Running quality checks...'}
        </span>
      </div>
    );
  }

  if (!report) return null;

  const qualityConf = QUALITY_CONFIG[report.overall_quality] || QUALITY_CONFIG.good;
  const QualityIcon = report.overall_quality === 'good'
    ? ShieldCheck
    : report.overall_quality === 'acceptable'
    ? ShieldAlert
    : ShieldX;

  return (
    <div className="space-y-3">
      {/* Overall quality header */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QualityIcon className={`h-5 w-5 ${
                report.overall_quality === 'good' ? 'text-green-600' :
                report.overall_quality === 'acceptable' ? 'text-amber-600' : 'text-red-600'
              }`} />
              <CardTitle className="text-sm">
                {dpT?.dataQuality || 'Data Quality'}
              </CardTitle>
              <Badge className={qualityConf.color}>
                {qualityConf.label[lang]}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={load} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        {report.total_flagged > 0 && (
          <CardContent className="pt-0 pb-3 px-4">
            <p className="text-sm text-muted-foreground">{report.recommendation}</p>
          </CardContent>
        )}
      </Card>

      {/* Individual checks */}
      {report.checks.map((check) => {
        const conf = STATUS_CONFIG[check.status] || STATUS_CONFIG.ok;
        const Icon = conf.icon;
        const label = CHECK_LABELS[check.check_type]?.[lang] || check.check_type;

        return (
          <Card key={check.check_type} className={check.status !== 'ok' ? conf.bg : ''}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${conf.color}`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {check.status !== 'ok' && (
                    <Badge variant="outline" className={`text-xs ${conf.color}`}>
                      {check.flagged_count} ({check.pct_flagged}%)
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      check.status === 'ok' ? 'text-green-600' :
                      check.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                    }`}
                  >
                    {check.status === 'ok' ? 'OK' : check.status}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{check.description}</p>
              {check.status !== 'ok' && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">
                  {check.suggested_action}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
