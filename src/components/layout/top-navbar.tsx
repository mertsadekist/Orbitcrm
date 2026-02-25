"use client";

import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "./user-nav";
import { MobileSidebar } from "./mobile-sidebar";

type TopNavbarProps = {
  companyName: string;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  user: { firstName: string; lastName: string; email: string; canViewAnalytics: boolean };
  leadCount: number;
  role: string;
  onSignOut: () => void;
};

export function TopNavbar({
  companyName,
  isCollapsed,
  onToggleSidebar,
  user,
  leadCount,
  role,
  onSignOut,
}: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile menu */}
      <MobileSidebar leadCount={leadCount} role={role} canViewAnalytics={user.canViewAnalytics} />

      {/* Desktop toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="hidden lg:flex"
      >
        {isCollapsed ? (
          <PanelLeft className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Company name */}
      <span className="text-sm font-medium text-muted-foreground">
        {companyName}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <ThemeToggle />
      <UserNav
        firstName={user.firstName}
        lastName={user.lastName}
        email={user.email}
        onSignOut={onSignOut}
      />
    </header>
  );
}
