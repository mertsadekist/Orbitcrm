// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLead = any;

function esc(v: unknown) {
  const s = String(v ?? "");
  const needs = /[",\n\r]/.test(s);
  const out = s.replace(/"/g, '""');
  return needs ? '"' + out + '"' : out;
}

export function formatLeadsToCSV(leads: AnyLead[]): string {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Company",
    "Status",
    "Score",
    "Source",
    "Assigned To",
    "Created",
    "Quiz",
    "Deals Count",
    "Total Deal Value",
  ];

  const rows = leads.map((l) => {
    const name = [l?.firstName ?? "", l?.lastName ?? ""].filter(Boolean).join(" ");
    const assigned = l?.assignedTo
      ? [l.assignedTo.firstName ?? "", l.assignedTo.lastName ?? ""]
          .filter(Boolean)
          .join(" ")
      : "";
    const quizTitle = l?.quiz?.title ?? "";
    const dealsCount = Array.isArray(l?.deals) ? l.deals.length : 0;
    const totalDealValue = Array.isArray(l?.deals)
      ? l.deals.reduce(
          (sum: number, d: AnyLead) => sum + (Number(d?.value) || 0),
          0
        )
      : 0;

    return [
      esc(name),
      esc(l?.email),
      esc(l?.phone),
      esc(l?.companyName),
      esc(l?.status),
      esc(l?.score),
      esc(l?.source),
      esc(assigned),
      esc(l?.createdAt ? new Date(l.createdAt).toISOString() : ""),
      esc(quizTitle),
      esc(dealsCount),
      esc(totalDealValue),
    ].join(",");
  });

  // BOM for Excel Arabic support
  return "\ufeff" + [headers.join(","), ...rows].join("\n");
}
