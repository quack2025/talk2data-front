import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, BookmarkIcon } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { ExploreBookmark } from '@/types/explore';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface BookmarkManagerProps {
  bookmarks: ExploreBookmark[];
  onSelect: (bookmark: ExploreBookmark) => void;
  onDelete: (bookmarkId: string) => void;
}

export function BookmarkManager({
  bookmarks,
  onSelect,
  onDelete,
}: BookmarkManagerProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <BookmarkIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          {t.explore?.noBookmarks || 'Sin análisis guardados'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t.explore?.noBookmarksHint || 'Ejecuta un análisis y guárdalo como bookmark'}
        </p>
      </div>
    );
  }

  return (
    <>
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1.5">
        {bookmarks.map((b) => (
          <div
            key={b.id}
            className="p-2.5 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors group"
            onClick={() => onSelect(b)}
          >
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm font-medium line-clamp-1">{b.title}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(b.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {b.analysis_config?.analysis_type || '?'}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(b.created_at), 'd MMM', { locale: dateLocale })}
              </span>
            </div>
            {b.notes && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{b.notes}</p>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>

    <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.explore?.confirmDeleteBookmark ?? '¿Eliminar este bookmark?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.explore?.confirmDeleteBookmarkDesc ?? 'Esta acción no se puede deshacer.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common?.cancel ?? 'Cancelar'}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (confirmDeleteId) onDelete(confirmDeleteId);
              setConfirmDeleteId(null);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t.common?.delete ?? 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
