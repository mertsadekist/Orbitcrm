import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Orbit, Shield } from "lucide-react";

type AdminNavbarProps = {
  userName: string;
};

export function AdminNavbar({ userName }: AdminNavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Orbit className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">OrbitFlow</span>
          <Badge
            variant="outline"
            className="border-white/30 text-white text-xs"
          >
            <Shield className="mr-1 h-3 w-3" />
            Super Admin
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90">{userName}</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
