import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/i18n/LanguageContext';

interface ValueLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variableName: string;
  variableLabel: string;
  currentLabels: Record<string, string>;
  autoLabels: Record<string, string>;
  onSave: (labels: Record<string, string>) => void;
  isSaving?: boolean;
}

export function ValueLabelsDialog({
  open,
  onOpenChange,
  variableName,
  variableLabel,
  currentLabels,
  autoLabels,
  onSave,
  isSaving,
}: ValueLabelsDialogProps) {
  const { t } = useLanguage();
  const meta = t.dataPrep?.metadata;

  const [editedLabels, setEditedLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      // Merge auto + current (current takes precedence)
      setEditedLabels({ ...autoLabels, ...currentLabels });
    }
  }, [open, currentLabels, autoLabels]);

  const codes = Object.keys(editedLabels).sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const handleLabelChange = (code: string, label: string) => {
    setEditedLabels(prev => ({ ...prev, [code]: label }));
  };

  const handleSave = () => {
    // Only save labels that differ from auto and are non-empty
    const overrides: Record<string, string> = {};
    for (const [code, label] of Object.entries(editedLabels)) {
      if (label && label.trim() && label !== autoLabels[code]) {
        overrides[code] = label.trim();
      }
    }
    onSave(overrides);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {meta?.editValues || 'Edit Value Labels'}: {variableName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{variableLabel}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            <div className="grid grid-cols-[80px_1fr] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>{meta?.codeHeader || 'Code'}</span>
              <span>{meta?.labelHeader || 'Label'}</span>
            </div>
            {codes.map(code => (
              <div key={code} className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <span className="text-sm font-mono text-muted-foreground px-1">{code}</span>
                <Input
                  value={editedLabels[code] || ''}
                  onChange={e => handleLabelChange(code, e.target.value)}
                  placeholder={autoLabels[code] || code}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            {codes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {meta?.noValues || 'No values found for this variable'}
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common?.cancel || 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (meta?.saving || 'Saving...') : (meta?.saveLabels || 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
