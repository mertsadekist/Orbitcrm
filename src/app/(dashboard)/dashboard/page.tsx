import { getTenant } from "@/lib/auth/get-tenant";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const tenant = await getTenant();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">OrbitFlow Dashboard</h1>
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Session Info
            <Badge variant="outline">{tenant.role}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {tenant.firstName}{" "}
            {tenant.lastName}
          </p>
          <p>
            <span className="font-medium">Username:</span> {tenant.username}
          </p>
          <p>
            <span className="font-medium">Email:</span> {tenant.email}
          </p>
          <p>
            <span className="font-medium">Subscription:</span>{" "}
            {tenant.subscriptionId}
          </p>
          <p>
            <span className="font-medium">Company ID:</span> {tenant.companyId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
