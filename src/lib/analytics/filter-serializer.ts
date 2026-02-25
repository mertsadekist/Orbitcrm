import type { FilterRow } from "@/types/analytics";

export function serializeFilters(filters: FilterRow[]): string {
  const json = JSON.stringify(filters ?? []);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function deserializeFilters(str?: string | null): FilterRow[] {
  if (!str) return [];
  try {
    const json = Buffer.from(str, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
