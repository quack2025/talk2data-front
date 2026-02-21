import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Key, Plus, Copy, Trash2, ShieldOff, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useToast } from '@/hooks/use-toast';

type Permission = 'read' | 'write' | 'admin';

const PERMISSION_COLORS: Record<Permission, string> = {
  read: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  write: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ApiKeys() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const {
    keys,
    isLoading,
    error,
    newKeySecret,
    fetchKeys,
    createKey,
    deactivateKey,
    deleteKey,
  } = useApiKeys();

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermission, setNewKeyPermission] = useState<Permission>('read');
  const [isCreating, setIsCreating] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Translation helpers with Spanish fallbacks
  const label = useCallback(
    (key: string, fallback: string): string => {
      const apiKeys = (t as any).apiKeys;
      return apiKeys?.[key] || fallback;
    },
    [t],
  );

  useEffect(() => {
    fetchKeys();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    try {
      await createKey({ name: newKeyName.trim(), permissions: newKeyPermission });
      setShowSecret(true);
      toast({
        title: label('keyCreated', 'API key creada'),
        description: label('keyCreatedDesc', 'La key ha sido creada exitosamente.'),
      });
    } catch (err) {
      toast({
        title: (t as any).toasts?.error || 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setNewKeyName('');
      setNewKeyPermission('read');
      setShowSecret(false);
    }
    setDialogOpen(open);
  };

  const handleCopySecret = async () => {
    if (!newKeySecret) return;
    try {
      await navigator.clipboard.writeText(newKeySecret);
      toast({
        title: label('copied', 'Copiado'),
        description: label('copiedDesc', 'La key ha sido copiada al portapapeles.'),
      });
    } catch {
      toast({
        title: (t as any).toasts?.error || 'Error',
        description: label('copyFailed', 'No se pudo copiar al portapapeles.'),
        variant: 'destructive',
      });
    }
  };

  const handleDeactivate = async (keyId: string) => {
    setDeactivatingId(keyId);
    try {
      await deactivateKey(keyId);
      toast({
        title: label('keyDeactivated', 'Key desactivada'),
        description: label('keyDeactivatedDesc', 'La API key ha sido desactivada.'),
      });
    } catch (err) {
      toast({
        title: (t as any).toasts?.error || 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleDelete = async (keyId: string) => {
    setDeletingId(keyId);
    try {
      await deleteKey(keyId);
      toast({
        title: label('keyDeleted', 'Key eliminada'),
        description: label('keyDeletedDesc', 'La API key ha sido eliminada permanentemente.'),
      });
    } catch (err) {
      toast({
        title: (t as any).toasts?.error || 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {label('title', 'API Keys')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {label('subtitle', 'Gestiona tus keys de acceso a la API')}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {label('createNewKey', 'Crear nueva key')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{label('createNewKey', 'Crear nueva key')}</DialogTitle>
              </DialogHeader>

              {showSecret && newKeySecret ? (
                /* Secret display after creation */
                <div className="space-y-4">
                  <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      {label(
                        'secretWarning',
                        'Esta key solo se mostrara una vez. Copiala ahora.',
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={newKeySecret}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                      title={label('copy', 'Copiar')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleDialogClose(false)}
                  >
                    {label('done', 'Listo')}
                  </Button>
                </div>
              ) : (
                /* Creation form */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">
                      {label('keyName', 'Nombre')}
                    </Label>
                    <Input
                      id="key-name"
                      placeholder={label('keyNamePlaceholder', 'Mi aplicacion')}
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      disabled={isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key-permission">
                      {label('permission', 'Permiso')}
                    </Label>
                    <Select
                      value={newKeyPermission}
                      onValueChange={(value) => setNewKeyPermission(value as Permission)}
                      disabled={isCreating}
                    >
                      <SelectTrigger id="key-permission">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">
                          {label('permRead', 'Lectura (read)')}
                        </SelectItem>
                        <SelectItem value="write">
                          {label('permWrite', 'Escritura (write)')}
                        </SelectItem>
                        <SelectItem value="admin">
                          {label('permAdmin', 'Administrador (admin)')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full gap-2"
                    onClick={handleCreate}
                    disabled={!newKeyName.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {label('creating', 'Creando...')}
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        {(t as any).common?.create || 'Crear'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && keys.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                {label('noKeys', 'No tienes API keys')}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {label(
                  'noKeysDesc',
                  'Crea tu primera API key para acceder a la API de forma programatica.',
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Keys list */}
        {!isLoading && keys.length > 0 && (
          <div className="space-y-3">
            {keys.map((apiKey) => {
              const isActive = apiKey.is_active;
              const permission = (apiKey.permissions || 'read') as Permission;

              return (
                <Card key={apiKey.id} className={!isActive ? 'opacity-60' : ''}>
                  <CardContent className="flex items-center justify-between py-4">
                    {/* Key info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <Key className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {apiKey.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className={PERMISSION_COLORS[permission]}
                          >
                            {permission}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              isActive
                                ? 'border-green-500 text-green-700 dark:text-green-400'
                                : 'border-gray-400 text-gray-500'
                            }
                          >
                            {isActive
                              ? label('statusActive', 'Activa')
                              : label('statusInactive', 'Inactiva')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            {label('created', 'Creada')}: {formatDate(apiKey.created_at)}
                          </span>
                          <span>
                            {label('lastUsed', 'Ultimo uso')}:{' '}
                            {apiKey.last_used_at
                              ? formatDate(apiKey.last_used_at)
                              : label('never', 'Nunca')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleDeactivate(apiKey.id)}
                          disabled={deactivatingId === apiKey.id}
                          title={label('deactivate', 'Desactivar')}
                        >
                          {deactivatingId === apiKey.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldOff className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">
                            {label('deactivate', 'Desactivar')}
                          </span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeleteId(apiKey.id)}
                        disabled={deletingId === apiKey.id}
                        title={label('delete', 'Eliminar')}
                      >
                        {deletingId === apiKey.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {(t as any).common?.delete || 'Eliminar'}
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{label('confirmDeleteTitle', '¿Eliminar esta API key?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {label('confirmDeleteDesc', 'Esta acción no se puede deshacer. La key será eliminada permanentemente.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{(t as any).common?.cancel || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(t as any).common?.delete || 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
