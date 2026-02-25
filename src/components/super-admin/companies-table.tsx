"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, LogIn, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyListItem } from "@/actions/super-admin/get-companies";

type CompaniesTableProps = {
  companies: CompanyListItem[];
  loading: boolean;
  onSelect: (company: CompanyListItem) => void;
  onToggleStatus: (companyId: string) => void;
  onImpersonate: (companyId: string) => void;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function PlanBadge({ plan }: { plan: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        plan === "FREE" &&
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        plan === "STARTER" &&
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
        plan === "PROFESSIONAL" &&
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        plan === "ENTERPRISE" &&
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      )}
    >
      {plan}
    </Badge>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        isActive
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export function CompaniesTable({
  companies,
  loading,
  onSelect,
  onToggleStatus,
  onImpersonate,
}: CompaniesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead className="w-[120px]">Plan</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[90px]">Users</TableHead>
            <TableHead className="w-[80px]">Leads</TableHead>
            <TableHead className="w-[110px]">Revenue</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                {loading ? "Loading companies..." : "No companies found."}
              </TableCell>
            </TableRow>
          ) : (
            companies.map((company) => (
              <TableRow
                key={company.id}
                className="cursor-pointer transition-colors"
                onClick={() => onSelect(company)}
              >
                <TableCell>
                  <div>
                    <span className="font-medium">{company.name}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {company.slug}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <PlanBadge plan={company.plan} />
                </TableCell>
                <TableCell>
                  <StatusBadge isActive={company.isActive} />
                </TableCell>
                <TableCell className="text-sm">
                  {company.activeUsers}/{company.maxUsers}
                </TableCell>
                <TableCell className="text-sm">
                  {company._count.leads}
                </TableCell>
                <TableCell className="text-sm">
                  {currencyFormatter.format(company.revenue)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(company);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {company.isActive && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onImpersonate(company.id);
                          }}
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Login As
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(company.id);
                        }}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {company.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
