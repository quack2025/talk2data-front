import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Download, Trash2, MoreVertical, FileSpreadsheet, Presentation, MessageSquare, Table2 } from 'lucide-react';
import type { Export } from '@/types/database';
import { useLanguage } from '@/i18n/LanguageContext';

const formatConfig = {
  pdf: { label: 'PDF', color: 'text-red-500', icon: FileText },
  excel: { label: 'Excel', color: 'text-green-500', icon: FileSpreadsheet },
  pptx: { label: 'PowerPoint', color: 'text-orange-500', icon: Presentation },
  aggfile: { label: 'Aggfile', color: 'text-blue-500', icon: Table2 },
};

interface ExportCardProps {
  export_: Export;
  onDelete: (id: string) => void;
  onDownload: (export_: Export) => void;
}

export function ExportCard({ export_, onDelete, onDownload }: ExportCardProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const formatInfo = formatConfig[export_.export_type] ?? { label: export_.export_type, color: 'text-muted-foreground', icon: FileText };
  const FormatIcon = formatInfo.icon;

  const isConversation = !!export_.conversation_id;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Preview/Icon */}
          <div className="h-24 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FormatIcon className={`h-10 w-10 ${formatInfo.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium truncate">
                  {t.exports.report} {formatInfo.label}
                </h3>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  {isConversation ? (
                    <>
                      <MessageSquare className="h-3 w-3" />
                      {t.exports.specificConversation}
                    </>
                  ) : (
                    <>
                      <FileText className="h-3 w-3" />
                      {t.exports.generalSummary}
                    </>
                  )}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDownload(export_)}>
                    <Download className="mr-2 h-4 w-4" />
                    {t.exports.download}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(export_.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t.common.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="default">{t.exports.ready}</Badge>
              <Badge variant="outline">{formatInfo.label}</Badge>
              {isConversation && (
                <Badge variant="secondary" className="gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Chat
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(export_.created_at), "d MMM yyyy, HH:mm", { locale: dateLocale })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onDownload(export_)}
          >
            <Download className="h-4 w-4" />
            {t.exports.download}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
