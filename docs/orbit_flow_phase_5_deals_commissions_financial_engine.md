# OrbitFlow SaaS CRM — Phase 5: Deals & Commissions (Financial Engine)

> **الهدف**: بناء المحرك المالي: إغلاق الصفقات مع **تقسيم العمولات تلقائياً**, Pipeline Kanban للصفقات, وإدارة العمولات. عند تحويل Lead إلى **CONVERTED** يتم عرض **Close Deal Modal** لتسجيل الصفقة وتوزيع العمولات ثم حفظ **Deal + Commissions** في Transaction واحد مع **Confetti**.

---

## 0) New Dependency

```bash
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

---

## 1) TypeScript Types

### File
- `src/types/deal.ts`

### 1.1 SerializedDeal

```ts
export interface SerializedDeal {
  id: string;
  companyId: string;
  leadId?: string | null;
  assignedToId?: string | null;
  title: string;
  value: string; // Decimal serialized
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: { firstName: string; lastName: string; company?: string | null } | null;
  assignedTo?: { firstName: string; lastName: string; avatar?: string | null } | null;
  commissions?: SerializedCommission[];
}
```

### 1.2 SerializedCommission

```ts
export interface SerializedCommission {
  id: string;
  dealId: string;
  userId: string;
  amount: string; // Decimal serialized
  percentage: number;
  status: CommissionStatus;
  paidAt?: string | null;
  user: { firstName: string; lastName: string; avatar?: string | null };
}
```

### 1.3 CommissionSplit (Form)

```ts
export interface CommissionSplit {
  userId: string;
  label: string;
  percentage: number; // 0-100
  amount: number;     // auto-calculated
}
```

### 1.4 CloseDealFormData

```ts
export interface CloseDealFormData {
  leadId: string;
  title: string;
  value: number;
  currency: string;
  splits: CommissionSplit[]; // user-only splits (company share implied)
}
```

### 1.5 DealFilters

```ts
export interface DealFilters {
  stage?: DealStage;
  assigneeId?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

---

## 2) Zod Validation

### File
- `src/lib/validators/deal-schema.ts`

### Schemas

| Schema | Description |
|---|---|
| `closeDealSchema` | title(1-200), value(>0, max 9,999,999,999.99), currency, splits[] |
| `commissionSplitSchema` | userId, percentage(0.01-100), label |
| `updateDealStageSchema` | dealId, newStage |
| `approveCommissionSchema` | commissionId |

### Critical Refinement
- مجموع `splits.percentage` يجب أن يكون **≤ 100**.

> **Company share** = `100% - sum(userSplits)` (ضمني، لا يُخزّن كسجل Commission).

---

## 3) Deal Utility Functions

### File
- `src/lib/deal-utils.ts`

Functions:
- `calculateSplitAmount(totalValue, percentage)` → Decimal rounded to 2 places
- `calculateCompanyShare(totalValue, splits)` → remainder
- `getDealStageConfig(stage)` → `{ label, colorClass, icon }`
- `formatCurrency(amount, currency)` → "$75,000.00"

### Constants Update
Add to `src/lib/constants.ts`:

- `DEAL_STAGES` config:
  - PROSPECTING: light blue
  - QUALIFICATION: blue
  - PROPOSAL: yellow
  - NEGOTIATION: orange
  - CLOSED_WON: green
  - CLOSED_LOST: red

---

## 4) Server Actions (Deals)

### Folder
- `src/actions/deal/`

---

### 4.1 close-deal.ts (Most Important)

**Permission**: EMPLOYEE+ (any authenticated user)

**Flow**:
1) `getTenant()` + Zod validation
2) Verify: Lead exists + same company + not already converted
3) Verify: all `userId` in splits belong to same company
4) Verify: sum(percentages) ≤ 100
5) `prisma.$transaction`:
   - a) Create Deal (`stage=CLOSED_WON`, `closedAt=now`, `probability=100`)
   - b) Create Commission rows for each split (`status=PENDING`)
   - c) Update Lead (`status=CONVERTED`, `convertedAt=now`)
   - d) Create AuditLog (CREATE Deal)
6) Return `{ success, dealId }`

---

### 4.2 deal-crud.ts

| Action | Role | Description |
|---|---|---|
| `getDeals(filters?)` | EMPLOYEE+ | fetch with filters + include lead, assignedTo, commissions |
| `getDealById(dealId)` | EMPLOYEE+ | fetch full deal + all relations |
| `createDeal(data)` | MANAGER+ | manual deal create (no close) |
| `updateDeal(dealId, data)` | MANAGER+ | update title/value/probability/expectedCloseDate |
| `deleteDeal(dealId)` | OWNER+ | delete deal + related commissions |

---

### 4.3 update-deal-stage.ts (Drag & Drop)

**Permission**: EMPLOYEE+

Rules:
1) Cannot move deals in `CLOSED_WON` or `CLOSED_LOST`.
2) If new stage is `CLOSED_WON`:
   - return `{ requiresModal: true }` → UI opens commission summary modal
3) If new stage is `CLOSED_LOST`:
   - update `stage`, set `closedAt`, set `probability=0`
4) Else:
   - update stage + set probability based on stage
5) Always write AuditLog

---

### 4.4 commission-actions.ts

| Action | Role | Description |
|---|---|---|
| `approveCommission(commissionId)` | OWNER+ | status → APPROVED |
| `payCommission(commissionId)` | OWNER+ | status → PAID, set `paidAt=now` |
| `bulkApproveCommissions(ids)` | OWNER+ | bulk approve |

---

## 5) React Query Hooks

### Folder
- `src/hooks/`

| Hook | Description |
|---|---|
| `useDeals(filters?)` | fetch deals with filters |
| `useDeal(dealId)` | fetch full deal |
| `useDealStageMutation()` | stage mutation + optimistic updates |
| `useCloseDealMutation()` | close deal modal submit |
| `useCommissionMutation()` | approve/pay |

---

## 6) Close Deal Modal

### File
- `src/components/deals/close-deal-modal.tsx`

### Trigger
- From Leads Kanban: dragging lead → CONVERTED
- From Lead Details: “Create Deal”

### Implementation
- Client component
- `react-hook-form` + `zod`

### UI Structure

```text
┌─ Header: "Close Deal 🎉" + Lead Name ──────────────┐
├─ Deal Title (auto: "{Lead Name} - Deal")            ─┤
├─ Total Amount + Currency                             ─┤
├─ Commission Splits                                   ─┤
│  🏢 Company Share: 40% = $40,000.00 (computed)       │
│  👤 John Owner:    35% = $35,000.00                  │
│  👤 Sarah Manager: 25% = $25,000.00                  │
│  [+ Add Split]                                       │
│  Total: 100% = $100,000.00 ✅                         │
├─ [Cancel]                               [Close Deal] ┤
└───────────────────────────────────────────────────────┘
```

### Subcomponents

| Component | Description |
|---|---|
| `commission-splits-editor.tsx` | dynamic splits editor |
| `commission-split-row.tsx` | user select + % input + calculated amount |
| `company-share-display.tsx` | computed company share row |
| `deal-amount-input.tsx` | amount input + currency formatting |

### Behavior
- Autofill title
- Auto-add split: if lead has `assignedTo` add initial split
- Live calculation on amount/%
- Validation: sum ≤ 100, each > 0
- User selector: Command searchable dropdown

### Confetti

File: `src/lib/confetti.ts`

```ts
import confetti from "canvas-confetti";

export function fireDealConfetti() {
  confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
  setTimeout(
    () => confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } }),
    250
  );
}
```

---

## 7) Pipeline Page (Deals Kanban)

### Server Page
- `src/app/(dashboard)/pipeline/page.tsx`
- `getTenant()` → fetch deals + include lead, assignedTo
- pass to `PipelineBoard`

### Client Board
- `src/components/pipeline/pipeline-board.tsx`

Columns (6):
- PROSPECTING → QUALIFICATION → PROPOSAL → NEGOTIATION → CLOSED_WON → CLOSED_LOST

Differences vs Lead Kanban:
- `CLOSED_WON` & `CLOSED_LOST` immutable (no dragging out)
- Drag to `CLOSED_WON`:
  - if no commissions → open commission modal
- Drag to `CLOSED_LOST`:
  - confirm → set stage + closedAt

### Card
- `src/components/pipeline/pipeline-card.tsx`
- shows: title, value, lead name, probability badge
- probability color:
  - <30 red
  - 30–60 yellow
  - >60 green

### Column
- `src/components/pipeline/pipeline-column.tsx`
- header: colored dot + stage label + count + sum of values
- `CLOSED_WON/CLOSED_LOST`: tinted background

### Filters
- `src/components/pipeline/pipeline-filter-bar.tsx`
- nuqs URL state
- assignee + value range + date range

---

## 8) Deal Details Sheet

### File
- `src/components/deals/deal-details-sheet.tsx`

- right slide-over
- fetch deal via React Query

Tabs:

| Tab | Content |
|---|---|
| Details | edit title/value/probability/expectedCloseDate (MANAGER+) |
| Commissions | table with Approve/Pay (OWNER+) |
| Timeline | AuditLog entries |

### Commission Table
- `src/components/deals/commission-table.tsx`

- First row is Company share (computed) — not DB
- Approve/Pay buttons only for OWNER+
- Paid shows `paidAt`

---

## 9) Integration Changes (Phase 4)

### 9.1 Leads Kanban Intercept
Modify `src/components/leads/kanban-board.tsx`:
- Drag lead → CONVERTED:
  - do NOT update directly
  - open CloseDealModal with lead data
- On success:
  - move lead to CONVERTED
- On cancel:
  - revert to original status

### 9.2 Sidebar
Modify `src/components/layout/sidebar.tsx`:
- enable Pipeline link
- icon: `TrendingUp` (lucide-react)

### 9.3 Lead Deals Tab
Modify `src/components/leads/lead-tab-deals.tsx`:
- show linked deals
- “Create Deal” button opens CloseDealModal

---

## 10) File Tree (Phase 5)

```text
src/
├── types/deal.ts
├── lib/
│   ├── deal-utils.ts
│   ├── confetti.ts
│   └── validators/
│       └── deal-schema.ts
├── hooks/
│   ├── use-deals.ts
│   └── use-commission-mutation.ts
├── actions/deal/
│   ├── close-deal.ts
│   ├── deal-crud.ts
│   ├── update-deal-stage.ts
│   └── commission-actions.ts
├── components/
│   ├── deals/
│   │   ├── close-deal-modal.tsx
│   │   ├── commission-splits-editor.tsx
│   │   ├── commission-split-row.tsx
│   │   ├── company-share-display.tsx
│   │   ├── deal-amount-input.tsx
│   │   ├── deal-details-sheet.tsx
│   │   ├── deal-tab-details.tsx
│   │   ├── deal-tab-commissions.tsx
│   │   ├── deal-tab-timeline.tsx
│   │   └── commission-table.tsx
│   └── pipeline/
│       ├── pipeline-board.tsx
│       ├── pipeline-card.tsx
│       ├── pipeline-column.tsx
│       └── pipeline-filter-bar.tsx
└── app/(dashboard)/pipeline/
    ├── page.tsx
    └── loading.tsx
```

- New files: ~22
- Modified: 3 (leads kanban, sidebar, lead deals tab)

---

## 11) Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Company share | implied | no need for DB rows |
| Closed deals | immutable | prevent tampering |
| Deal+Commissions | single transaction | strong consistency |
| Confetti | canvas-confetti | lightweight, no deps |
| Money storage | Decimal(12,2) | financial accuracy |

---

## 12) Verification Checklist

- [ ] Drag Lead → CONVERTED → CloseDealModal appears
- [ ] Splits sum: 35+25+15 → Company shows 25 → total 100%
- [ ] Live calc updates with amount changes
- [ ] Validation blocks splits > 100%
- [ ] Confetti fires on success + toast
- [ ] Cancel modal → lead reverts, DB unchanged
- [ ] Pipeline: drag PROPOSAL → NEGOTIATION → updates
- [ ] CLOSED_WON immutable (cannot drag out)
- [ ] OWNER approve/pay commission works
- [ ] Buttons hidden for non-OWNER
- [ ] Deal details sheet tabs load
- [ ] Tenant scoping enforced for deals/commissions

---

✅ **Phase 5 complete when all verification items pass.**
