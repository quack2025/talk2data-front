import { Loader2, Search, BarChart3, Users, Grid3X3, Target, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutoDetect } from "@/hooks/useAutoDetect";
import type { DetectedBanner, DetectedGroup } from "@/types/autodetect";

const TYPE_ICONS: Record<string, typeof BarChart3> = {
  awareness: Target,
  scale: BarChart3,
  grid_single: Grid3X3,
  demographic: Users,
};

const TYPE_COLORS: Record<string, string> = {
  awareness: "bg-green-100 text-green-800",
  scale: "bg-blue-100 text-blue-800",
  grid_single: "bg-purple-100 text-purple-800",
  nps: "bg-orange-100 text-orange-800",
  top_of_mind: "bg-yellow-100 text-yellow-800",
  ranking: "bg-red-100 text-red-800",
  demographic: "bg-gray-100 text-gray-800",
  single: "bg-indigo-100 text-indigo-800",
  multiple: "bg-pink-100 text-pink-800",
};

interface AutoDetectPanelProps {
  projectId: string;
  onRunGroupedAnalysis?: () => void;
}

export function AutoDetectPanel({ projectId, onRunGroupedAnalysis }: AutoDetectPanelProps) {
  const { data: spec, isLoading, error, refetch } = useAutoDetect(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            Error en la auto-deteccion: {(error as Error).message}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!spec) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Auto-Deteccion de Patrones
          </CardTitle>
          <CardDescription>
            {spec.case_count} casos | {spec.variable_groups.length} grupos |{" "}
            {spec.banners.length} banners | {spec.individual_variables.length} variables
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Detected Banners */}
      {spec.banners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <Users className="h-4 w-4 inline mr-2" />
              Banners Detectados ({spec.banners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {spec.banners.map((banner: DetectedBanner) => (
                <Badge key={banner.variable} variant="secondary" className="text-sm">
                  {banner.label || banner.variable}
                  <span className="ml-1 text-xs opacity-60">
                    ({banner.n_categories} cat.)
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variable Groups */}
      {spec.variable_groups.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                <Grid3X3 className="h-4 w-4 inline mr-2" />
                Grupos de Variables ({spec.variable_groups.length})
              </CardTitle>
            </div>
            {onRunGroupedAnalysis && (
              <Button size="sm" onClick={onRunGroupedAnalysis}>
                <BarChart3 className="h-4 w-4 mr-1" />
                Analizar Grupos
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {spec.variable_groups.map((group: DetectedGroup) => {
                const colorClass = TYPE_COLORS[group.question_type] || "bg-gray-100 text-gray-800";
                return (
                  <div
                    key={group.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {group.display_name}
                        </span>
                        <Badge className={`text-xs ${colorClass}`}>
                          {group.question_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {group.variables.length} variables | Confianza: {Math.round(group.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
