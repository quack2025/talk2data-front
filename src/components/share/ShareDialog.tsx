import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { Link, Copy, Trash2, Lock, Eye, Plus, Loader2 } from 'lucide-react';
import { useShare } from '@/hooks/useShare';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import type { ShareResourceType, ShareLinkOut } from '@/types/share';

interface ShareDialogProps {
  projectId: string;
  resourceType?: ShareResourceType;
  resourceId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESOURCE_TYPE_OPTIONS: { value: ShareResourceType; label: string }[] = [
  { value: 'executive_summary', label: 'Executive Summary' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'explore_bookmark', label: 'Explore Bookmark' },
  { value: 'export', label: 'Export' },
];

const EXPIRATION_OPTIONS = [
  { value: 'none', label: 'Sin expiración', labelEn: 'No expiration' },
  { value: '24', label: '24 horas', labelEn: '24 hours' },
  { value: '48', label: '48 horas', labelEn: '48 hours' },
  { value: '168', label: '7 días', labelEn: '7 days' },
  { value: '720', label: '30 días', labelEn: '30 days' },
];

export function ShareDialog({
  projectId,
  resourceType: fixedResourceType,
  resourceId,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { links, isLoading, fetchLinks, createLink, deleteLink } = useShare(projectId);

  // Form state
  const [selectedResourceType, setSelectedResourceType] = useState<ShareResourceType>(
    fixedResourceType ?? 'executive_summary'
  );
  const [expiration, setExpiration] = useState<string>('none');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch links when dialog opens
  useEffect(() => {
    if (open) {
      fetchLinks();
    }
  }, [open, fetchLinks]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createLink({
        resource_type: fixedResourceType ?? selectedResourceType,
        resource_id: resourceId ?? null,
        expires_in_hours: expiration === 'none' ? null : Number(expiration),
        password: password.trim() || null,
        notes: notes.trim() || null,
      });

      // Reset form
      setExpiration('none');
      setPassword('');
      setNotes('');

      toast({
        title: t.share?.linkCreated || 'Enlace creado',
        description: t.share?.linkCreatedDesc || 'El enlace para compartir ha sido creado.',
      });
    } catch {
      toast({
        title: t.share?.error || 'Error',
        description: t.share?.createError || 'No se pudo crear el enlace.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    setDeletingId(linkId);
    try {
      await deleteLink(linkId);
      toast({
        title: t.share?.linkDeleted || 'Enlace eliminado',
      });
    } catch {
      toast({
        title: t.share?.error || 'Error',
        description: t.share?.deleteError || 'No se pudo eliminar el enlace.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t.share?.copied || 'Copiado',
        description: t.share?.copiedDesc || 'Enlace copiado al portapapeles.',
      });
    } catch {
      toast({
        title: t.share?.error || 'Error',
        description: t.share?.copyError || 'No se pudo copiar el enlace.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (link: ShareLinkOut) => {
    if (!link.expires_at) return false;
    return new Date(link.expires_at) < new Date();
  };

  const getResourceTypeLabel = (type: ShareResourceType) => {
    const option = RESOURCE_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label ?? type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            {t.share?.title || 'Compartir'}
          </DialogTitle>
          <DialogDescription className="sr-only">Share project link settings</DialogDescription>
        </DialogHeader>

        {/* Create Link Form */}
        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
          <h4 className="text-sm font-medium">
            {t.share?.createNew || 'Crear nuevo enlace'}
          </h4>

          {/* Resource type selector — only shown if not fixed */}
          {!fixedResourceType && (
            <div className="space-y-1.5">
              <Label htmlFor="resource-type" className="text-xs">
                {t.share?.resourceType || 'Tipo de recurso'}
              </Label>
              <Select
                value={selectedResourceType}
                onValueChange={(v) => setSelectedResourceType(v as ShareResourceType)}
              >
                <SelectTrigger id="resource-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Expiration */}
          <div className="space-y-1.5">
            <Label htmlFor="expiration" className="text-xs">
              {t.share?.expiration || 'Expiración'}
            </Label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger id="expiration" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {language === 'en' ? opt.labelEn : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              {t.share?.password || 'Contraseña (opcional)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.share?.passwordPlaceholder || 'Dejar vacío para no requerir'}
              className="h-9"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">
              {t.share?.notes || 'Notas (opcional)'}
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.share?.notesPlaceholder || 'Nota interna sobre este enlace'}
              className="h-9"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={isCreating}
            size="sm"
            className="w-full"
          >
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {t.share?.createLink || 'Crear enlace'}
          </Button>
        </div>

        {/* Existing Links */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            {t.share?.existingLinks || 'Enlaces existentes'}
          </h4>

          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && links.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t.share?.noLinks || 'No hay enlaces compartidos aún.'}
            </p>
          )}

          {links.map((link) => (
            <div
              key={link.id}
              className="border rounded-lg p-3 space-y-2 text-sm"
            >
              {/* Top row: badge + meta */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {getResourceTypeLabel(link.resource_type)}
                  </Badge>
                  {link.has_password && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {link.expires_at && (
                    <Badge
                      variant={isExpired(link) ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {isExpired(link)
                        ? t.share?.expired || 'Expirado'
                        : `${t.share?.expires || 'Expira'} ${formatDate(link.expires_at)}`}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setConfirmDeleteId(link.id)}
                  disabled={deletingId === link.id}
                >
                  {deletingId === link.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Share URL row */}
              {link.share_url && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">
                    {link.share_url}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopy(link.share_url!)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Bottom row: views + created date */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {link.view_count} {t.share?.views || 'vistas'}
                </span>
                <span>
                  {t.share?.created || 'Creado'} {formatDate(link.created_at)}
                </span>
                {link.notes && (
                  <span className="truncate italic">{link.notes}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.share?.confirmDeleteTitle || '¿Eliminar este enlace?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.share?.confirmDeleteDesc || 'Esta acción no se puede deshacer. El enlace dejará de funcionar.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common?.cancel || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common?.delete || 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
