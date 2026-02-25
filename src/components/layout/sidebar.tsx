"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarNavItem } from "./sidebar-nav-item";
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  TrendingUp,
  BarChart3,
  Settings,
  Shield,
  Orbit,
} from "lucide-react";

type SidebarProps = {
  isCollapsed: boolean;
  leadCount: number;
  role: string;
  canViewAnalytics: boolean;
};

const ROLE_LEVELS: Record<string, number> = {
  EMPLOYEE: 1,
  MANAGER: 2,
  OWNER: 3,
  SUPER_ADMIN: 4,
};

const mainNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/leads", icon: Users, label: "Leads", hasBadge: true },
  { href: "/quizzes", icon: FileQuestion, label: "Quizzes" },
  { href: "/pipeline", icon: TrendingUp, label: "Pipeline" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", requiresPermission: "canViewAnalytics" as const },
  { href: "/settings", icon: Settings, label: "Settings", minRole: "MANAGER" },
];

export function Sidebar({ isCollapsed, leadCount, role, canViewAnalytics }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col border-r bg-muted/30">
        {/* Logo */}
        <div
          className={cn(
            "flex h-14 items-center border-b px-4",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Orbit className="h-6 w-6 shrink-0 text-primary" />
          {!isCollapsed && (
            <span className="ml-2 text-lg font-bold">OrbitFlow</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2">
          {mainNav
            .filter((item) => {
              if (item.minRole && (ROLE_LEVELS[role] ?? 0) < (ROLE_LEVELS[item.minRole] ?? 99)) {
                return false;
              }
              if (item.requiresPermission === "canViewAnalytics" && !canViewAnalytics) {
                return false;
              }
              return true;
            })
            .map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname.startsWith(item.href)}
                isCollapsed={isCollapsed}
                badge={item.hasBadge ? leadCount : undefined}
              />
            ))}

          {role === "SUPER_ADMIN" && (
            <>
              <div className="my-2 border-t" />
              <SidebarNavItem
                href="/super-admin/logs"
                icon={Shield}
                label="Super Admin"
                isActive={pathname.startsWith("/super-admin")}
                isCollapsed={isCollapsed}
              />
            </>
          )}
        </nav>
      </div>
    </TooltipProvider>
  );
}
