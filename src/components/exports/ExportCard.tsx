import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Download, Eye, Trash2, MoreVertical } from 'lucide-react';
import type { Export } from '@/types/database';

const formatConfig = {
  pdf: { label: 'PDF', color: 'text-red-500' },
  excel: { label: 'Excel', color: 'text-green-500' },
  pptx: { label: 'PowerPoint', color: 'text-orange-500' },
};

interface ExportCardProps {
  export_: Export;
  onDelete: (id: string) => void;
  onDownload: (export_: Export) => void;
}

export function ExportCard({ export_, onDelete, onDownload }: ExportCardProps) {
  const formatInfo = formatConfig[export_.export_type] ?? { label: export_.export_type, color: 'text-muted-foreground' };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Preview/Icon */}
          <div className="h-24 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FileText className={`h-10 w-10 ${formatInfo.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium truncate">
                  Reporte {formatInfo.label}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {export_.conversation_id ? 'Conversación específica' : 'Resumen general'}
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
                    Descargar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    Vista previa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(export_.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="default">Listo</Badge>
              <Badge variant="outline">{formatInfo.label}</Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(export_.created_at), "d MMM yyyy, HH:mm", { locale: es })}
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
            Descargar
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
