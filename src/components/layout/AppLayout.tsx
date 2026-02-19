import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { HelpChatWidget } from "@/components/help-chat";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function AppLayout({ children, title, showHeader = true }: AppLayoutProps) {
  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        {showHeader && <AppHeader title={title} />}
        <main className="flex-1 min-h-0 overflow-auto">
          {children}
        </main>
      </div>
      <HelpChatWidget />
    </div>
  );
}
