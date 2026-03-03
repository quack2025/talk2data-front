import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface TabSpecUploadWidgetProps {
  data: {
    project_id: string;
  };
}

interface ParsedRule {
  name: string;
  rule_type: string;
  variable?: string;
  variable_found?: boolean;
  config: Record<string, unknown>;
}

interface ImportResult {
  format_detected: string;
  sheets_found: string[];
  rules: ParsedRule[];
  summary: string;
  warnings: string[];
}

export function TabSpecUploadWidget({ data }: TabSpecUploadWidgetProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [phase, setPhase] = useState<'upload' | 'preview' | 'applying' | 'applied'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());
  const [applyResult, setApplyResult] = useState<{ rules_created: number; warnings: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError(null);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.uploadFile<ImportResult>(
        `/projects/${data.project_id}/data-prep/import-tabspec`,
        formData
      );
      setImportResult(result);
      // Select all rules with found variables by default
      const defaultSelected = new Set<number>();
      result.rules.forEach((rule, i) => {
        if (rule.variable_found !== false) {
          defaultSelected.add(i);
        }
      });
      setSelectedRules(defaultSelected);
      setPhase('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to parse TabSpec file.');
    } finally {
      setIsUploading(false);
    }
  }, [file, data.project_id]);

  const handleApply = useCallback(async () => {
    if (!importResult) return;
    setPhase('applying');
    try {
      const rulesToApply = importResult.rules.filter((_, i) => selectedRules.has(i));
      const result = await api.post<{ rules_created: number; warnings: string[] }>(
        `/projects/${data.project_id}/data-prep/apply-tabspec`,
        { rules: rulesToApply }
      );
      setApplyResult(result);
      setPhase('applied');
      toast({
        title: 'TabSpec imported',
        description: `${result.rules_created} rules created successfully.`,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to apply TabSpec rules.');
      setPhase('preview');
    }
  }, [importResult, selectedRules, data.project_id, toast]);

  const toggleRule = (index: number) => {
    setSelectedRules(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (!importResult) return;
    if (selectedRules.size === importResult.rules.length) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(importResult.rules.map((_, i) => i)));
    }
  };

  // Phase: Applied
  if (phase === 'applied' && applyResult) {
    return (
      <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-700 dark:text-green-400">
            TabSpec imported successfully
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {applyResult.rules_created} rules created. Go to Data Prep to review.
        </p>
        {applyResult.warnings.length > 0 && (
          <div className="text-xs text-amber-600 space-y-1">
            {applyResult.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Phase: Applying
  if (phase === 'applying') {
    return (
      <div className="rounded-lg border p-4 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm">Applying rules...</span>
      </div>
    );
  }

  // Phase: Preview
  if (phase === 'preview' && importResult) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {importResult.rules.length} rules found
            </span>
            <Badge variant="outline" className="text-xs">
              {importResult.format_detected}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setPhase('upload'); setFile(null); setImportResult(null); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {importResult.warnings.length > 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-3 py-2 space-y-1">
            {importResult.warnings.map((w, i) => (
              <p key={i}><AlertTriangle className="h-3 w-3 inline mr-1" />{w}</p>
            ))}
          </div>
        )}

        <ScrollArea className="max-h-[200px]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-1 border-b">
              <Checkbox
                checked={selectedRules.size === importResult.rules.length}
                onCheckedChange={toggleAll}
              />
              <span className="text-xs font-medium text-muted-foreground">Select all</span>
            </div>
            {importResult.rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <Checkbox
                  checked={selectedRules.has(i)}
                  onCheckedChange={() => toggleRule(i)}
                />
                <span className="text-xs flex-1 truncate">{rule.name}</span>
                <Badge variant="outline" className="text-[10px]">{rule.rule_type}</Badge>
                {rule.variable && (
                  <span className={`text-[10px] ${rule.variable_found ? 'text-green-600' : 'text-red-500'}`}>
                    {rule.variable}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {selectedRules.size} of {importResult.rules.length} selected
          </span>
          <Button size="sm" onClick={handleApply} disabled={selectedRules.size === 0}>
            Apply Selected
          </Button>
        </div>
      </div>
    );
  }

  // Phase: Upload
  return (
    <div className="rounded-lg border border-dashed p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Upload TabSpec File</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload an Excel file (.xlsx, .xls) with your data preparation specifications.
      </p>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <label className="flex-1">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate">
              {file ? file.name : 'Choose file...'}
            </span>
          </div>
        </label>
        <Button
          size="sm"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Upload'
          )}
        </Button>
      </div>
    </div>
  );
}
