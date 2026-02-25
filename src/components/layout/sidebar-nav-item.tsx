"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";

type SidebarNavItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: number;
  disabled?: boolean;
};

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  badge,
  disabled,
}: SidebarNavItemProps) {
  if (disabled) {
    const inner = (
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed",
          isCollapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!isCollapsed && (
          <>
            <span className="truncate">{label}</span>
            <span className="ml-auto text-xs">Soon</span>
          </>
        )}
      </div>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent side="right">{label} (Coming soon)</TooltipContent>
        </Tooltip>
      );
    }
    return inner;
  }

  const inner = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge != null && badge > 0 && (
            <span
              className={cn(
                "ml-auto rounded-full px-1.5 py-0.5 text-xs font-medium",
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted-foreground/10 text-muted-foreground"
              )}
            >
              {badge > 999 ? "999+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">
          {label}
          {badge != null && badge > 0 && ` (${badge})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}
