import {
  getCompanies,
  type CompanyFilters,
} from "@/actions/super-admin/get-companies";
import { CompaniesClient } from "@/components/super-admin/companies-client";
import { CreateCompanyDialog } from "@/components/super-admin/create-company-dialog";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompaniesPage({ searchParams }: Props) {
  const params = await searchParams;

  const filters: CompanyFilters = {
    search: (params.search as string) || undefined,
    plan: (params.plan as string) || undefined,
    isActive: (params.isActive as "true" | "false") || undefined,
    page: params.page ? Number(params.page) : 1,
    pageSize: 25,
  };

  const result = await getCompanies(filters);

  const initialData = result.success
    ? result.data
    : { companies: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Manage tenant companies, quotas, and subscriptions.
          </p>
        </div>
        <CreateCompanyDialog />
      </div>
      <CompaniesClient initialData={initialData} initialFilters={filters} />
    </div>
  );
}
