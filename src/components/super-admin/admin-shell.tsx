import { AdminNavbar } from "./admin-navbar";
import { AdminSidebar } from "./admin-sidebar";

type AdminShellProps = {
  userName: string;
  children: React.ReactNode;
};

export function AdminShell({ userName, children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminNavbar userName={userName} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
