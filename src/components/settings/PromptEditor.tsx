import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, RotateCcw, Info } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { PLACEHOLDER_DESCRIPTIONS } from '@/types/userPreferences';
import { cn } from '@/lib/utils';

interface PromptEditorProps {
  value: string;
  defaultPrompt: string;
  placeholders: string[];
  onChange: (value: string) => void;
  onReset: () => void;
  maxLength?: number;
}

export function PromptEditor({
  value,
  defaultPrompt,
  placeholders,
  onChange,
  onReset,
  maxLength = 10000,
}: PromptEditorProps) {
  const { t, language } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTableOpen, setIsTableOpen] = useState(false);

  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + placeholder + value.slice(end);
    
    onChange(newValue);

    // Restore focus and set cursor position after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + placeholder.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const isDefault = value === defaultPrompt;
  const charCount = value.length;
  const isOverLimit = charCount > maxLength;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t.userPreferences.promptEditor}
        </CardTitle>
        <CardDescription>
          {t.userPreferences.promptEditorDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Placeholders badges */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {t.userPreferences.clickToInsert}
          </p>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((placeholder) => {
              const description = PLACEHOLDER_DESCRIPTIONS[placeholder]?.[language] || placeholder;
              return (
                <Tooltip key={placeholder}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-mono text-xs"
                      onClick={() => insertPlaceholder(placeholder)}
                    >
                      {placeholder}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={20}
            className={cn(
              'font-mono text-sm resize-none',
              isOverLimit && 'border-destructive focus-visible:ring-destructive'
            )}
            placeholder={defaultPrompt}
          />
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span className={cn(isOverLimit && 'text-destructive font-medium')}>
              {charCount.toLocaleString()} / {maxLength.toLocaleString()} {t.userPreferences.characters}
            </span>
            {isDefault && (
              <span className="text-muted-foreground italic">
                {t.userPreferences.usingDefault}
              </span>
            )}
          </div>
        </div>

        {/* Reset button */}
        {!isDefault && (
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {t.userPreferences.resetToDefault}
          </Button>
        )}

        {/* Placeholders reference table */}
        <Collapsible open={isTableOpen} onOpenChange={setIsTableOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="gap-2 p-0 h-auto text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
              {t.userPreferences.placeholderReference}
              <ChevronDown className={cn('h-4 w-4 transition-transform', isTableOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">{t.userPreferences.placeholder}</TableHead>
                  <TableHead>{t.userPreferences.placeholderDescription}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholders.map((placeholder) => {
                  const description = PLACEHOLDER_DESCRIPTIONS[placeholder]?.[language] || placeholder;
                  return (
                    <TableRow key={placeholder}>
                      <TableCell className="font-mono text-sm">{placeholder}</TableCell>
                      <TableCell className="text-muted-foreground">{description}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
