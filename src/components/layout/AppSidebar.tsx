import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  MessageSquare,
  FileDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Users,
  Key,
  LogOut,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSummaryNotification } from "@/contexts/SummaryNotificationContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { FolderSection } from "@/components/folders/FolderSection";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { pendingCount } = useSummaryNotification();

  // Folder state — derived from URL search params on /projects
  const selectedFolderId = useMemo(() => {
    if (location.pathname !== "/projects") return null;
    const folder = searchParams.get("folder");
    return folder; // null = "All", "unorganized" = no folder, otherwise folder id
  }, [location.pathname, searchParams]);

  // Project counts for folder badges
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const [totalProjectCount, setTotalProjectCount] = useState(0);

  useEffect(() => {
    fetchProjectCounts();
  }, []);

  const fetchProjectCounts = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, folder_id");

      if (error) throw error;
      if (!data) return;

      const counts: Record<string, number> = {};
      let unorganized = 0;
      data.forEach((p: any) => {
        if (p.folder_id) {
          counts[p.folder_id] = (counts[p.folder_id] ?? 0) + 1;
        } else {
          unorganized++;
        }
      });
      counts["unorganized"] = unorganized;
      setProjectCounts(counts);
      setTotalProjectCount(data.length);
    } catch (err) {
      console.error("Error fetching project counts:", err);
    }
  };

  const handleSelectFolder = (folderId: string | null) => {
    if (folderId === null) {
      navigate("/projects");
    } else {
      navigate(`/projects?folder=${folderId}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const projectId = active.data.current?.projectId;
    const folderId = over.data.current?.folderId ?? null;

    if (!projectId) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ folder_id: folderId })
        .eq("id", projectId);

      if (error) throw error;

      toast.success(t.folders?.title ?? "Moved");
      fetchProjectCounts();
    } catch (err) {
      console.error("Error moving project:", err);
      toast.error("Error");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "T2";

  const coreItems = [
    {
      title: t.sidebar.projects,
      href: "/projects",
      icon: LayoutDashboard,
    },
    {
      title: t.sidebar.uploadData,
      href: "/upload",
      icon: Upload,
    },
    {
      title: t.sidebar.chat,
      href: "/chat",
      icon: MessageSquare,
    },
    {
      title: t.sidebar.export,
      href: "/exports",
      icon: FileDown,
    },
    {
      title: t.sidebar.teams || 'Equipos',
      href: "/teams",
      icon: Users,
    },
    {
      title: t.sidebar.apiKeys || 'API Keys',
      href: "/api-keys",
      icon: Key,
    },
  ];

  const accountItems = [
    {
      title: t.sidebar.usage ?? 'Usage',
      href: "/settings?tab=usage",
      icon: BarChart3,
    },
    {
      title: t.sidebar.billing ?? 'Billing',
      href: "/settings?tab=billing",
      icon: CreditCard,
    },
    {
      title: t.sidebar.settings,
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <DndContext onDragEnd={handleDragEnd}>
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Block */}
      <Link to="/projects" className="block">
        <div className={cn(
          "m-3 p-3 bg-white rounded-lg flex items-center gap-3 animate-fade-in",
          collapsed && "justify-center"
        )}>
          <img src="/genius-labs-logo.webp" alt="Talk2data" className="w-8 h-8 object-contain shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-sm text-foreground truncate">Talk2data</span>
          )}
          {/* Background processing indicator */}
          {pendingCount > 0 && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary animate-pulse ml-auto">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {!collapsed && <span className="text-xs font-medium">{pendingCount}</span>}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t.summary?.generating || 'Generando resumen ejecutivo...'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {/* Core Zone */}
        <div className="space-y-1">
          {coreItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </div>

        {/* Separator */}
        <div className="my-3 mx-3 border-t border-sidebar-border" />

        {/* Folder Section */}
        <FolderSection
          collapsed={collapsed}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          projectCounts={projectCounts}
          totalCount={totalProjectCount}
        />

        {/* Separator */}
        <div className="my-3 mx-3 border-t border-sidebar-border" />

        {/* Account Zone */}
        <div className="space-y-1">
          {accountItems.map((item) => {
            const isActive = item.href === "/settings"
              ? location.pathname === "/settings" && !location.search
              : location.pathname + location.search === item.href;

            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </div>
      </nav>

      {/* User Section — always at bottom */}
      <div className="mt-auto border-t border-sidebar-border p-2 space-y-1">
        {/* User info */}
        {user && (
          <div className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5",
            collapsed && "justify-center"
          )}>
            <Avatar className="h-8 w-8 shrink-0 border border-sidebar-accent">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer actions (API Docs, Language, Logout) */}
        {collapsed ? (
          <>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"
                >
                  <ExternalLink className="h-5 w-5 shrink-0" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                API Docs
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <LanguageSelector variant="ghost" className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Language
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full justify-center text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {t.header?.signOut || 'Sign out'}
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <a
              href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"
            >
              <ExternalLink className="h-5 w-5 shrink-0" />
              <span>API Docs</span>
            </a>
            <div className="flex items-center gap-1 px-2">
              <LanguageSelector variant="ghost" className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>{t.header?.signOut || 'Sign out'}</span>
              </Button>
            </div>
          </>
        )}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>{t.sidebar.collapse}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
    </DndContext>
  );
}
