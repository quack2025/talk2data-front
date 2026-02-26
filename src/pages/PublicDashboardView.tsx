import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Lock,
  Clock,
  FileText,
  LayoutDashboard,
  BarChart3,
  Table2,
  Gauge,
  TrendingUp,
  Type,
  Hash,
} from "lucide-react";
import type { PublicDashboardResponse, DashboardWidget, DashboardTheme } from "@/types/dashboard";
import { WIDGET_TYPE_LABELS } from "@/types/dashboard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type ViewState =
  | { kind: "loading" }
  | { kind: "password_required" }
  | { kind: "expired" }
  | { kind: "not_found" }
  | { kind: "error"; message: string }
  | { kind: "success"; data: PublicDashboardResponse };

// ---------------------------------------------------------------------------
// Widget renderers
// ---------------------------------------------------------------------------

const WIDGET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  kpi_card: Hash,
  frequency_chart: BarChart3,
  crosstab_table: Table2,
  nps_gauge: Gauge,
  trend_line: TrendingUp,
  compare_means_chart: BarChart3,
  text_block: Type,
};

function WidgetCard({ widget }: { widget: DashboardWidget }) {
  const Icon = WIDGET_ICONS[widget.widget_type] || BarChart3;
  const result = widget.cached_result;

  const renderResult = () => {
    if (!result) {
      return (
        <p className="text-sm text-muted-foreground">
          No data available
        </p>
      );
    }

    if (result.type === "text") {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {(result.text as string) || ""}
        </div>
      );
    }

    if (result.type === "kpi") {
      return (
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-primary">
            {result.value != null ? String(result.value) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(result.label as string) || widget.title}
          </p>
          <p className="text-xs text-muted-foreground">
            n = {String(result.n || 0)}
          </p>
        </div>
      );
    }

    if (result.type === "nps") {
      return (
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-primary">
            {result.nps_score != null ? String(result.nps_score) : "—"}
          </p>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="text-green-600">
              P: {String(result.promoters_pct || 0)}%
            </span>
            <span className="text-yellow-600">
              N: {String(result.passives_pct || 0)}%
            </span>
            <span className="text-red-600">
              D: {String(result.detractors_pct || 0)}%
            </span>
          </div>
        </div>
      );
    }

    if (result.type === "frequency" && Array.isArray(result.items)) {
      return (
        <div className="space-y-1.5">
          {(result.items as Array<Record<string, unknown>>).slice(0, 10).map(
            (item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate text-muted-foreground">
                  {String(item.label || item.value || "")}
                </span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{
                      width: `${Math.min(Number(item.percentage || 0), 100)}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right">
                  {Number(item.percentage || 0).toFixed(1)}%
                </span>
              </div>
            )
          )}
        </div>
      );
    }

    // Fallback: show raw JSON
    return (
      <pre className="text-xs overflow-auto max-h-40 bg-muted/50 rounded p-2">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">{widget.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{renderResult()}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PublicDashboardView() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchDashboard = useCallback(
    async (pwd?: string) => {
      if (!token) {
        setState({ kind: "not_found" });
        return;
      }

      const url = new URL(
        `${API_BASE_URL}/api/v1/public/dashboards/${token}`
      );
      if (pwd) {
        url.searchParams.set("password", pwd);
      }

      try {
        const res = await fetch(url.toString());

        if (res.status === 401) {
          setState({ kind: "password_required" });
          return;
        }
        if (res.status === 410) {
          setState({ kind: "expired" });
          return;
        }
        if (res.status === 404) {
          setState({ kind: "not_found" });
          return;
        }
        if (!res.ok) {
          const body = await res.text();
          setState({
            kind: "error",
            message: body || `Unexpected error (${res.status})`,
          });
          return;
        }

        const data: PublicDashboardResponse = await res.json();
        setState({ kind: "success", data });
      } catch (err: unknown) {
        setState({
          kind: "error",
          message:
            err instanceof Error
              ? err.message
              : "Network error. Please try again later.",
        });
      }
    },
    [token]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setPasswordLoading(true);
    await fetchDashboard(password.trim());
    setPasswordLoading(false);
  };

  // ---------------------------------------------------------------------------
  // Render per state
  // ---------------------------------------------------------------------------

  function renderContent() {
    switch (state.kind) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading dashboard...
            </p>
          </div>
        );

      case "password_required":
        return (
          <Card className="mx-auto max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Password Required</CardTitle>
              <CardDescription>
                This dashboard is password-protected. Enter the password to view
                it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={passwordLoading || !password.trim()}
                >
                  {passwordLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Unlock
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case "expired":
        return (
          <Card className="mx-auto max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Clock className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Link Expired</CardTitle>
              <CardDescription>
                This shared dashboard has expired. Please request a new link.
              </CardDescription>
            </CardHeader>
          </Card>
        );

      case "not_found":
        return (
          <Card className="mx-auto max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>Not Found</CardTitle>
              <CardDescription>
                This dashboard does not exist or has been unpublished.
              </CardDescription>
            </CardHeader>
          </Card>
        );

      case "error":
        return (
          <Alert variant="destructive" className="mx-auto max-w-lg">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        );

      case "success": {
        const { data } = state;
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">
                  {data.name}
                </h1>
              </div>
              <Badge variant="secondary">Dashboard</Badge>
            </div>

            {data.description && (
              <p className="text-muted-foreground">{data.description}</p>
            )}

            {/* Widgets grid */}
            {data.widgets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <LayoutDashboard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>This dashboard has no widgets yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.widgets.map((widget) => (
                  <WidgetCard key={widget.id} widget={widget} />
                ))}
              </div>
            )}
          </div>
        );
      }
    }
  }

  // Theme branding
  const theme: DashboardTheme | null =
    state.kind === "success" && state.data.theme
      ? (state.data.theme as DashboardTheme)
      : null;

  const bodyStyle: React.CSSProperties = theme
    ? {
        backgroundColor: theme.background_color || undefined,
        color: theme.text_color || undefined,
        fontFamily: theme.font_family || undefined,
      }
    : {};

  const headerIsBranded = theme?.header_style === "branded";
  const headerIsMinimal = theme?.header_style === "minimal";

  return (
    <div className="min-h-screen" style={bodyStyle}>
      {/* Top bar */}
      <header
        className="border-b"
        style={
          headerIsBranded && theme
            ? { backgroundColor: theme.primary_color, color: "#fff" }
            : undefined
        }
      >
        <div className="container mx-auto flex h-14 items-center px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {theme?.logo_url && (
              <img
                src={theme.logo_url}
                alt="Logo"
                className="h-8 max-w-[120px] object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            {!headerIsMinimal && (
              <span
                className="font-heading text-lg font-bold"
                style={
                  headerIsBranded
                    ? { color: "#fff" }
                    : theme?.primary_color
                      ? { color: theme.primary_color }
                      : undefined
                }
              >
                {theme?.company_name || "Survey Genius Pro"}
              </span>
            )}
          </div>
          <div className="ml-auto">
            <Badge
              variant="outline"
              className="text-xs font-normal"
              style={headerIsBranded ? { borderColor: "rgba(255,255,255,0.4)", color: "#fff" } : undefined}
            >
              Shared Dashboard
            </Badge>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 text-center text-xs"
        style={{ opacity: 0.5 }}
      >
        Powered by Survey Genius Pro
      </footer>
    </div>
  );
}
