import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Lock,
  Clock,
  Download,
  MessageSquare,
  FileText,
  Bookmark,
} from "lucide-react";
import type { SharedResourceResponse } from "@/types/share";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type ViewState =
  | { kind: "loading" }
  | { kind: "password_required" }
  | { kind: "expired" }
  | { kind: "not_found" }
  | { kind: "error"; message: string }
  | { kind: "success"; data: SharedResourceResponse };

// ---------------------------------------------------------------------------
// Resource-type renderers
// ---------------------------------------------------------------------------

function ExecutiveSummaryView({ content }: { content: Record<string, any> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Executive Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {content.content ?? "No content available."}
        </div>
      </CardContent>
    </Card>
  );
}

function ConversationView({ content }: { content: Record<string, any> }) {
  const messages: Array<{ role: string; content: string }> =
    content.messages ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {content.title ?? "Conversation"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No messages in this conversation.
          </p>
        )}
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="mb-1 text-xs font-semibold opacity-70">
                  {isUser ? "User" : "Assistant"}
                </p>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ExploreBookmarkView({ content }: { content: Record<string, any> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {content.title ?? "Explore Bookmark"}
          </CardTitle>
        </div>
        {content.notes && (
          <CardDescription>{content.notes}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {content.result_snapshot != null && (
          <div className="rounded-md border bg-muted/50 p-4 overflow-x-auto">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words">
              {typeof content.result_snapshot === "string"
                ? content.result_snapshot
                : JSON.stringify(content.result_snapshot, null, 2)}
            </pre>
          </div>
        )}
        {content.result_snapshot == null && (
          <p className="text-sm text-muted-foreground">
            No snapshot data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ExportView({ content }: { content: Record<string, any> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Export</CardTitle>
        </div>
        <CardDescription>
          Your exported file is ready for download.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content.download_url ? (
          <Button asChild className="gap-2">
            <a
              href={content.download_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4" />
              Download File
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Download link is not available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Utility: human-readable resource type labels
// ---------------------------------------------------------------------------

const RESOURCE_LABELS: Record<string, string> = {
  executive_summary: "Executive Summary",
  conversation: "Conversation",
  explore_bookmark: "Explore Bookmark",
  export: "Export",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchResource = useCallback(
    async (pwd?: string) => {
      if (!token) {
        setState({ kind: "not_found" });
        return;
      }

      const url = new URL(`${API_BASE_URL}/shared/${token}`);
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

        const data: SharedResourceResponse = await res.json();
        setState({ kind: "success", data });
      } catch (err: any) {
        setState({
          kind: "error",
          message: err?.message || "Network error. Please try again later.",
        });
      }
    },
    [token],
  );

  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setPasswordLoading(true);
    await fetchResource(password.trim());
    setPasswordLoading(false);
  };

  // ---------------------------------------------------------------------------
  // Render helpers per state
  // ---------------------------------------------------------------------------

  function renderContent() {
    switch (state.kind) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading shared resource...
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
                This shared resource is password-protected. Please enter the
                password to view it.
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
                This shared link has expired and is no longer available. Please
                request a new link from the person who shared it with you.
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
                The shared resource you are looking for does not exist or has
                been removed.
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
            {/* Project & resource type header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {data.project_name}
              </h1>
              <Badge variant="secondary">
                {RESOURCE_LABELS[data.resource_type] ?? data.resource_type}
              </Badge>
            </div>

            {/* Render resource-specific content */}
            {data.resource_type === "executive_summary" && (
              <ExecutiveSummaryView content={data.content} />
            )}
            {data.resource_type === "conversation" && (
              <ConversationView content={data.content} />
            )}
            {data.resource_type === "explore_bookmark" && (
              <ExploreBookmarkView content={data.content} />
            )}
            {data.resource_type === "export" && (
              <ExportView content={data.content} />
            )}
          </div>
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Page shell (no AppLayout, minimal public chrome)
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar / branding */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold text-foreground">
              Survey Genius Pro
            </span>
          </a>
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs font-normal">
              Shared Resource
            </Badge>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Powered by Survey Genius Pro
      </footer>
    </div>
  );
}
