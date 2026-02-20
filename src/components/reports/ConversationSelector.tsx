import { useState, useEffect, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, MessageSquare, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useConversationList } from '@/hooks/useConversationList';

interface ConversationSelectorProps {
  projectId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ConversationSelector({
  projectId,
  selectedIds,
  onSelectionChange,
}: ConversationSelectorProps) {
  const { t } = useLanguage();
  const rpt = t.reports;
  const { conversations, isLoading, fetchConversations } =
    useConversationList(projectId);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const allSelected =
    conversations.length > 0 && selectedIds.length === conversations.length;

  const handleToggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(conversations.map((c) => c.id));
    }
  };

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>{rpt?.selectConversations ?? 'Select conversations'}</Label>

      {/* Header: select all + counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all-conversations"
            checked={allSelected}
            onCheckedChange={handleToggleAll}
          />
          <Label
            htmlFor="select-all-conversations"
            className="text-sm font-normal cursor-pointer"
          >
            {rpt?.allConversations ?? 'All conversations'}
          </Label>
        </div>
        <span className="text-xs text-muted-foreground">
          {(rpt?.selectedCount ?? '{n} of {total} selected')
            .replace('{n}', String(selectedIds.length))
            .replace('{total}', String(conversations.length))}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={rpt?.searchConversations ?? 'Search conversations...'}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Scrollable list */}
      <ScrollArea className="max-h-[240px] rounded-md border">
        <div className="p-2 space-y-1">
          {filtered.map((conv) => (
            <label
              key={conv.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.includes(conv.id)}
                onCheckedChange={() => handleToggle(conv.id)}
              />
              <span className="flex-1 text-sm truncate" title={conv.title}>
                {conv.title}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDate(conv.created_at)}
              </span>
              <Badge variant="secondary" className="text-xs shrink-0 gap-1">
                <MessageSquare className="h-3 w-3" />
                {conv.message_count}
              </Badge>
              <Badge
                variant={conv.analysis_count > 0 ? 'default' : 'outline'}
                className="text-xs shrink-0 gap-1"
              >
                <BarChart3 className="h-3 w-3" />
                {conv.analysis_count > 0
                  ? conv.analysis_count
                  : rpt?.noAnalyses ?? 'No analyses'}
              </Badge>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
