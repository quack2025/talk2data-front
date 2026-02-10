import { Button } from '@/components/ui/button';
import { CornerDownLeft } from 'lucide-react';

/**
 * Extracts likely reply options from an AI clarification message.
 *
 * Detects:
 *  - Numbered lists:  "1. Option A"  /  "1) Option A"
 *  - Bullet lists:    "- Option A"   /  "• Option A"  /  "* Option A"
 *  - Quoted options:  "Option A" o "Option B"  (with connectors o/or/,)
 *  - Parenthesised:   (a) Option A   (b) Option B
 */
export function extractQuickReplies(text: string): string[] {
  if (!text) return [];

  // 1. Numbered / bulleted lists  (e.g.  "1. Foo"  or  "- Foo")
  const listPattern = /(?:^|\n)\s*(?:\d+[.)]\s*|[-•*]\s+|\([a-z]\)\s*)(.+)/gi;
  const listMatches = [...text.matchAll(listPattern)].map((m) =>
    m[1].replace(/[.;:]+$/, '').trim()
  );

  if (listMatches.length >= 2) {
    // Keep max 5 options to avoid flooding the UI
    return listMatches.slice(0, 5);
  }

  // 2. Quoted alternatives: "Opt A" o "Opt B" (supports «» and """)
  const quotedPattern = /["""«»]([^"""«»]{2,60})["""«»]/g;
  const quotedMatches = [...text.matchAll(quotedPattern)].map((m) => m[1].trim());

  if (quotedMatches.length >= 2) {
    return quotedMatches.slice(0, 5);
  }

  return [];
}

interface QuickReplyChipsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export function QuickReplyChips({ options, onSelect, disabled }: QuickReplyChipsProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5 ml-0.5">
      <CornerDownLeft className="h-3 w-3 text-muted-foreground mt-1.5 shrink-0" />
      {options.map((option) => (
        <Button
          key={option}
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-auto py-1 px-2.5 text-xs font-normal whitespace-normal text-left rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => onSelect(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

