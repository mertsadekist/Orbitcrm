"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";

type DashboardShellProps = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    canViewAnalytics: boolean;
  };
  companyName: string;
  leadCount: number;
  children: React.ReactNode;
  onSignOut: () => void;
};

export function DashboardShell({
  user,
  companyName,
  leadCount,
  children,
  onSignOut,
}: DashboardShellProps) {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 transition-all duration-200",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <Sidebar
          isCollapsed={isCollapsed}
          leadCount={leadCount}
          role={user.role}
          canViewAnalytics={user.canViewAnalytics}
        />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNavbar
          companyName={companyName}
          isCollapsed={isCollapsed}
          onToggleSidebar={toggle}
          user={user}
          leadCount={leadCount}
          role={user.role}
          onSignOut={onSignOut}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
