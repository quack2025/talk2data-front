import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSummaryNotification } from "@/contexts/SummaryNotificationContext";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { pendingCount } = useSummaryNotification();

  const navItems = [
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
  ];

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-sidebar-border">
        <Link to="/projects" className="flex items-center gap-2 animate-fade-in">
          <span className={cn(
            "font-semibold text-sidebar-foreground transition-all duration-300",
            collapsed ? "text-sm" : "text-lg"
          )}>
            {collapsed ? "SG" : "Survey Genius"}
          </span>
        </Link>
        
        {/* Background processing indicator */}
        {pendingCount > 0 && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary animate-pulse">
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

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
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
      </nav>

      {/* Settings & Collapse */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                to="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"
              >
                <Settings className="h-5 w-5 shrink-0" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {t.sidebar.settings}
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Link
              to="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span>{t.sidebar.settings}</span>
            </Link>
            <a
              href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"
            >
              <ExternalLink className="h-5 w-5 shrink-0" />
              <span>API Docs</span>
            </a>
          </>
        )}

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
  );
}
