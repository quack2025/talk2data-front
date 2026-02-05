import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function AppLayout({ children, title, showHeader = true }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0 h-full">
        {showHeader && <AppHeader title={title} />}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
