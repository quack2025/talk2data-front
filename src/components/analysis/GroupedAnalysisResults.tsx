import { BarChart3, Target, Grid3X3, Award, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  GroupSummary,
  AwarenessSummary,
  GridSummary,
  TopOfMindSummary,
} from "@/types/autodetect";

interface GroupedAnalysisResultsProps {
  groups: GroupSummary[];
  isLoading?: boolean;
}

export function GroupedAnalysisResults({ groups, isLoading }: GroupedAnalysisResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!groups || groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        if (group.error) {
          return (
            <Card key={group.group_name}>
              <CardContent className="flex items-center gap-2 py-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {group.display_name}: {group.error}
              </CardContent>
            </Card>
          );
        }

        switch (group.summary_type) {
          case "awareness":
            return <AwarenessCard key={group.group_name} data={group as AwarenessSummary} />;
          case "grid":
            return <GridCard key={group.group_name} data={group as GridSummary} />;
          case "top_of_mind":
            return <TopOfMindCard key={group.group_name} data={group as TopOfMindSummary} />;
          default:
            return (
              <Card key={group.group_name}>
                <CardHeader>
                  <CardTitle className="text-sm">{group.display_name}</CardTitle>
                  <CardDescription>
                    Tipo: {group.question_type} | {group.variables.length} variables
                  </CardDescription>
                </CardHeader>
              </Card>
            );
        }
      })}
    </div>
  );
}

function AwarenessCard({ data }: { data: AwarenessSummary }) {
  const sortedItems = [...data.items].sort((a, b) => b.awareness_pct - a.awareness_pct);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-green-600" />
          {data.display_name}
        </CardTitle>
        <CardDescription>
          Base: {data.total_base} | Awareness promedio: {data.average_awareness.toFixed(1)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div key={item.item} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate pr-2">{item.item}</span>
                <span className="font-medium shrink-0">
                  {item.awareness_pct.toFixed(1)}%
                </span>
              </div>
              <Progress value={item.awareness_pct} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GridCard({ data }: { data: GridSummary }) {
  const sortedItems = [...data.items].sort((a, b) => b.mean - a.mean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Grid3X3 className="h-4 w-4 text-purple-600" />
          {data.display_name}
        </CardTitle>
        <CardDescription>
          Media general: {data.overall_mean?.toFixed(2)} | Escala: {data.scale_min}-{data.scale_max}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-4">Item</th>
                <th className="text-right py-2 px-2">Base</th>
                <th className="text-right py-2 px-2">Media</th>
                <th className="text-right py-2 px-2">Desv.</th>
                {data.items[0]?.top2box !== undefined && (
                  <th className="text-right py-2 px-2">T2B</th>
                )}
                {data.items[0]?.bottom2box !== undefined && (
                  <th className="text-right py-2 pl-2">B2B</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.item} className="border-b last:border-0">
                  <td className="py-2 pr-4 truncate max-w-[200px]">{item.item}</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">{item.base}</td>
                  <td className="text-right py-2 px-2 font-medium">{item.mean.toFixed(2)}</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">
                    {item.std_dev.toFixed(2)}
                  </td>
                  {item.top2box !== undefined && (
                    <td className="text-right py-2 px-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.top2box.toFixed(1)}%
                      </Badge>
                    </td>
                  )}
                  {item.bottom2box !== undefined && (
                    <td className="text-right py-2 pl-2">
                      <Badge variant="outline" className="text-xs">
                        {item.bottom2box.toFixed(1)}%
                      </Badge>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TopOfMindCard({ data }: { data: TopOfMindSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-yellow-600" />
          {data.display_name}
        </CardTitle>
        <CardDescription>
          Base: {data.total_base} | Mencionadores: {data.total_mentioners}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.first_mention.map((item, idx) => (
            <div key={item.item} className="flex items-center gap-3">
              <span className="text-lg font-bold text-muted-foreground w-6">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm">
                  <span className="truncate pr-2">{item.item}</span>
                  <span className="font-medium shrink-0">
                    {item.pct.toFixed(1)}%
                  </span>
                </div>
                <Progress value={item.pct} className="h-1.5 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
