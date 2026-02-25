"use client";

import { useMemo } from "react";
import { useQueryState } from "nuqs";
import {
  deserializeFilters,
  serializeFilters,
} from "@/lib/analytics/filter-serializer";
import type { FilterRow } from "@/types/analytics";
import { FilterRowComp } from "@/components/analytics/filter-row";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

type QueryBuilderProps = {
  companyUsers: { id: string; firstName: string; lastName: string }[];
};

export function QueryBuilder({ companyUsers }: QueryBuilderProps) {
  const [f, setF] = useQueryState("f");

  const filters: FilterRow[] = useMemo(() => deserializeFilters(f), [f]);

  function update(next: FilterRow[]) {
    if (next.length === 0) {
      setF(null);
    } else {
      setF(serializeFilters(next));
    }
  }

  function add() {
    update([
      ...filters,
      {
        id: crypto.randomUUID(),
        field: "status",
        operator: "equals",
        value: "",
      },
    ]);
  }

  function clearAll() {
    update([]);
  }

  function remove(id: string) {
    update(filters.filter((x) => x.id !== id));
  }

  function change(id: string, patch: Partial<FilterRow>) {
    update(filters.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Filters</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Filter
          </Button>
          {filters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {filters.map((row) => (
          <FilterRowComp
            key={row.id}
            row={row}
            companyUsers={companyUsers}
            onRemove={() => remove(row.id)}
            onChange={(patch) => change(row.id, patch)}
          />
        ))}
        {filters.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No filters applied. Click <strong>Add Filter</strong> to narrow
            results.
          </p>
        )}
      </div>
    </div>
  );
}
