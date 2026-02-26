/**
 * ThemeEditor — side panel for customising dashboard visual theme.
 *
 * Saves the theme via `updateDashboard()` with debounce.
 * Sprint 17b (Theme customization)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Palette, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { DashboardTheme } from '@/types/dashboard';

interface ThemeEditorProps {
  theme: DashboardTheme | null;
  onSave: (theme: DashboardTheme) => void;
  onClose: () => void;
}

const DEFAULT_THEME: DashboardTheme = {
  primary_color: '#1e40af',
  accent_color: '#f59e0b',
  background_color: '#ffffff',
  text_color: '#1f2937',
  font_family: 'Inter',
  logo_url: null,
  company_name: null,
  header_style: 'default',
};

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Source Sans Pro',
  'Arial',
  'Georgia',
];

const HEADER_STYLES = [
  { value: 'default', labelEn: 'Default', labelEs: 'Predeterminado' },
  { value: 'minimal', labelEn: 'Minimal', labelEs: 'Minimalista' },
  { value: 'branded', labelEn: 'Branded', labelEs: 'Con marca' },
] as const;

const PRESETS: Array<{ name: string; theme: Partial<DashboardTheme> }> = [
  {
    name: 'Corporate Blue',
    theme: { primary_color: '#1e40af', accent_color: '#3b82f6', background_color: '#f8fafc', text_color: '#1e293b' },
  },
  {
    name: 'Modern Dark',
    theme: { primary_color: '#6366f1', accent_color: '#a78bfa', background_color: '#0f172a', text_color: '#e2e8f0' },
  },
  {
    name: 'Fresh Green',
    theme: { primary_color: '#059669', accent_color: '#34d399', background_color: '#f0fdf4', text_color: '#1f2937' },
  },
  {
    name: 'Warm Sunset',
    theme: { primary_color: '#dc2626', accent_color: '#f59e0b', background_color: '#fffbeb', text_color: '#1c1917' },
  },
  {
    name: 'Elegant Slate',
    theme: { primary_color: '#475569', accent_color: '#94a3b8', background_color: '#f1f5f9', text_color: '#334155' },
  },
];

export function ThemeEditor({ theme, onSave, onClose }: ThemeEditorProps) {
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';
  const [local, setLocal] = useState<DashboardTheme>({ ...DEFAULT_THEME, ...theme });
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (updated: DashboardTheme) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        onSave(updated);
      }, 600);
    },
    [onSave],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const update = useCallback(
    (field: keyof DashboardTheme, value: string | null) => {
      setLocal((prev) => {
        const updated = { ...prev, [field]: value };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave],
  );

  const applyPreset = useCallback(
    (preset: Partial<DashboardTheme>) => {
      setLocal((prev) => {
        const updated = { ...prev, ...preset };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave],
  );

  const handleReset = useCallback(() => {
    setLocal(DEFAULT_THEME);
    debouncedSave(DEFAULT_THEME);
  }, [debouncedSave]);

  return (
    <div className="border-l bg-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-1.5">
          <Palette className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {lang === 'es' ? 'Tema' : 'Theme'}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Color presets */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Presets' : 'Presets'}
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  className="flex items-center gap-1.5 p-1.5 rounded border text-xs hover:bg-muted/50 transition-colors"
                  onClick={() => applyPreset(p.theme)}
                >
                  <div className="flex gap-0.5">
                    <span
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: p.theme.primary_color }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: p.theme.accent_color }}
                    />
                  </div>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary color */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Color primario' : 'Primary color'}
            </Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={local.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer p-0"
              />
              <Input
                value={local.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="text-xs h-8 font-mono"
                maxLength={20}
              />
            </div>
          </div>

          {/* Accent color */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Color acento' : 'Accent color'}
            </Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={local.accent_color}
                onChange={(e) => update('accent_color', e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer p-0"
              />
              <Input
                value={local.accent_color}
                onChange={(e) => update('accent_color', e.target.value)}
                className="text-xs h-8 font-mono"
                maxLength={20}
              />
            </div>
          </div>

          {/* Background color */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Color de fondo' : 'Background color'}
            </Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={local.background_color}
                onChange={(e) => update('background_color', e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer p-0"
              />
              <Input
                value={local.background_color}
                onChange={(e) => update('background_color', e.target.value)}
                className="text-xs h-8 font-mono"
                maxLength={20}
              />
            </div>
          </div>

          {/* Text color */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Color de texto' : 'Text color'}
            </Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={local.text_color}
                onChange={(e) => update('text_color', e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer p-0"
              />
              <Input
                value={local.text_color}
                onChange={(e) => update('text_color', e.target.value)}
                className="text-xs h-8 font-mono"
                maxLength={20}
              />
            </div>
          </div>

          {/* Font family */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Tipografía' : 'Font'}
            </Label>
            <Select
              value={local.font_family}
              onValueChange={(v) => update('font_family', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">
                    <span style={{ fontFamily: f }}>{f}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Header style */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Estilo de encabezado' : 'Header style'}
            </Label>
            <Select
              value={local.header_style}
              onValueChange={(v) => update('header_style', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEADER_STYLES.map((hs) => (
                  <SelectItem key={hs.value} value={hs.value} className="text-xs">
                    {lang === 'es' ? hs.labelEs : hs.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company name */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Nombre de empresa' : 'Company name'}
            </Label>
            <Input
              value={local.company_name || ''}
              onChange={(e) => update('company_name', e.target.value || null)}
              className="text-xs h-8"
              placeholder={lang === 'es' ? 'Opcional' : 'Optional'}
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'URL del logo' : 'Logo URL'}
            </Label>
            <Input
              value={local.logo_url || ''}
              onChange={(e) => update('logo_url', e.target.value || null)}
              className="text-xs h-8"
              placeholder="https://..."
            />
            {local.logo_url && (
              <div className="border rounded p-2 flex items-center justify-center bg-muted/30">
                <img
                  src={local.logo_url}
                  alt="Logo preview"
                  className="max-h-10 max-w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* Preview swatch */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'es' ? 'Vista previa' : 'Preview'}
            </Label>
            <div
              className="rounded-lg border p-3 space-y-2"
              style={{
                backgroundColor: local.background_color,
                color: local.text_color,
                fontFamily: local.font_family,
              }}
            >
              {local.header_style === 'branded' && local.company_name && (
                <div
                  className="text-xs font-bold px-2 py-1 rounded"
                  style={{ backgroundColor: local.primary_color, color: '#fff' }}
                >
                  {local.company_name}
                </div>
              )}
              <div className="text-xs font-semibold" style={{ color: local.primary_color }}>
                {lang === 'es' ? 'Título del dashboard' : 'Dashboard Title'}
              </div>
              <div className="flex gap-2">
                <div
                  className="h-6 rounded px-2 flex items-center text-[10px] font-medium text-white"
                  style={{ backgroundColor: local.primary_color }}
                >
                  KPI 1
                </div>
                <div
                  className="h-6 rounded px-2 flex items-center text-[10px] font-medium text-white"
                  style={{ backgroundColor: local.accent_color }}
                >
                  KPI 2
                </div>
              </div>
              <div className="text-[10px] opacity-60">
                {lang === 'es' ? 'Texto de ejemplo' : 'Sample body text'}
              </div>
            </div>
          </div>

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-xs text-muted-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3" />
            {lang === 'es' ? 'Restablecer tema' : 'Reset to default'}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
