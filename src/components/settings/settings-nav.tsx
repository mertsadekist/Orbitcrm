"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, ScrollText, Database } from "lucide-react";

const ROLE_LEVELS: Record<string, number> = {
  EMPLOYEE: 1,
  MANAGER: 2,
  OWNER: 3,
  SUPER_ADMIN: 4,
};

const navItems = [
  { href: "/settings/users", icon: Users, label: "Users", minRole: "MANAGER" },
  {
    href: "/settings/audit-log",
    icon: ScrollText,
    label: "Audit Log",
    minRole: "OWNER",
  },
  {
    href: "/settings/backup",
    icon: Database,
    label: "Backup",
    minRole: "OWNER",
  },
];

type SettingsNavProps = {
  role: string;
};

export function SettingsNav({ role }: SettingsNavProps) {
  const pathname = usePathname();
  const roleLevel = ROLE_LEVELS[role] ?? 0;

  const visibleItems = navItems.filter(
    (item) => roleLevel >= (ROLE_LEVELS[item.minRole] ?? 99)
  );

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden lg:flex lg:w-48 lg:flex-col lg:gap-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile: horizontal tabs */}
      <nav className="flex gap-1 overflow-x-auto lg:hidden">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
