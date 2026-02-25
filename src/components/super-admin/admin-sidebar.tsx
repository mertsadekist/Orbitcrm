"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, BarChart3, ScrollText } from "lucide-react";

const navItems = [
  {
    label: "Companies",
    href: "/super-admin/companies",
    icon: Building2,
    disabled: false,
  },
  {
    label: "Global Stats",
    href: "/super-admin/stats",
    icon: BarChart3,
    disabled: false,
  },
  {
    label: "System Logs",
    href: "/super-admin/logs",
    icon: ScrollText,
    disabled: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r bg-muted/30">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed"
              >
                <Icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto text-xs">Soon</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
