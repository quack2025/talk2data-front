import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid3X3, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLanguage } from '@/i18n/LanguageContext';

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  view: 'list' | 'grid';
  onViewChange: (value: 'list' | 'grid') => void;
}

export function ProjectFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  view,
  onViewChange,
}: ProjectFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-1 gap-3 w-full sm:w-auto">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.projects.searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t.projects.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.projects.all}</SelectItem>
            <SelectItem value="active">{t.projects.active}</SelectItem>
            <SelectItem value="processing">{t.projects.processing}</SelectItem>
            <SelectItem value="completed">{t.projects.completed}</SelectItem>
            <SelectItem value="archived">{t.projects.archived}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(value) => value && onViewChange(value as 'list' | 'grid')}
        className="border rounded-lg p-1"
      >
        <ToggleGroupItem value="list" aria-label={t.projects.listView} className="h-8 w-8 p-0">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label={t.projects.gridView} className="h-8 w-8 p-0">
          <Grid3X3 className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
