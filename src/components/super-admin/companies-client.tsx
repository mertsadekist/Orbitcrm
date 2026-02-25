"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CompaniesFilterBar } from "./companies-filter-bar";
import { CompaniesTable } from "./companies-table";
import { CompanyDetailsSheet } from "./company-details-sheet";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCompanies,
  type PaginatedCompanies,
  type CompanyFilters,
  type CompanyListItem,
} from "@/actions/super-admin/get-companies";
import { toggleCompanyStatus } from "@/actions/super-admin/toggle-company-status";
import { impersonateCompany } from "@/actions/super-admin/impersonate-company";

type CompaniesClientProps = {
  initialData: PaginatedCompanies;
  initialFilters: CompanyFilters;
};

export function CompaniesClient({
  initialData,
  initialFilters,
}: CompaniesClientProps) {
  const [data, setData] = useState<PaginatedCompanies>(initialData);
  const [filters, setFilters] = useState<CompanyFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyListItem | null>(null);

  const router = useRouter();
  const { update } = useSession();

  const fetchCompanies = useCallback(
    async (currentFilters: CompanyFilters) => {
      setLoading(true);
      const result = await getCompanies(currentFilters);
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    },
    []
  );

  // Fetch on filter change
  useEffect(() => {
    fetchCompanies(filters);
  }, [filters, fetchCompanies]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.plan) params.set("plan", filters.plan);
    if (filters.isActive) params.set("isActive", filters.isActive);
    if (filters.page && filters.page > 1)
      params.set("page", String(filters.page));

    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [filters]);

  async function handleToggleStatus(companyId: string) {
    const result = await toggleCompanyStatus(companyId);
    if (result.success) {
      toast.success(
        `Company ${result.data.isActive ? "activated" : "deactivated"} successfully`
      );
      fetchCompanies(filters);
    } else {
      toast.error(result.error ?? "Failed to toggle company status");
    }
  }

  async function handleImpersonate(companyId: string) {
    const result = await impersonateCompany(companyId);
    if (result.success) {
      await update({
        companyId: result.data.companyId,
        companyName: result.data.companyName,
        isImpersonating: true,
        originalUserId: result.data.originalUserId,
        originalCompanyId: result.data.originalCompanyId,
      });
      router.push("/dashboard");
    } else {
      toast.error(result.error ?? "Failed to impersonate company");
    }
  }

  return (
    <div className="space-y-4">
      <CompaniesFilterBar filters={filters} onFilterChange={setFilters} />

      <div className={loading ? "opacity-60 transition-opacity" : ""}>
        <CompaniesTable
          companies={data.companies}
          loading={loading}
          onSelect={setSelectedCompany}
          onToggleStatus={handleToggleStatus}
          onImpersonate={handleImpersonate}
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {data.page} of {data.totalPages} ({data.total} total)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() =>
              setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
            }
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.totalPages}
            onClick={() =>
              setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
            }
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CompanyDetailsSheet
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
