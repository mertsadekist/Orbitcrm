# OrbitFlow SaaS CRM — Phase 4: The CRM & Pipeline (Management Engine)

> **الهدف**: بناء واجهة CRM لإدارة العملاء المحتملين وتحويل البيانات إلى سير عمل فعّال لفريق المبيعات: **Kanban بالسحب والإفلات**, **Lead Details Sheet** غني بالتبويبات, **Quick Actions** (WhatsApp/Call/Email), وفلاتر URL قابلة للمشاركة + Bulk Actions.

---

## 0) Dependencies

### Install

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns nuqs
```

### Shadcn Components

```bash
npx shadcn@latest add tabs tooltip popover command scroll-area skeleton
```

---

## 1) Foundation Files

### 1.1 Types

#### File
- `src/types/lead.ts`

#### المطلوب
- `SerializedLead`: Lead مع `Date` كسلاسل ISO + relations (assignedTo, quiz)
- `FullLead`: للـ Details sheet، يشمل deals
- `CompanyUser`: مختصر للـ dropdowns
- `LeadFilters`: parameters للفلاتر
- `LeadStatusValue`: union type

---

### 1.2 Constants

#### File
- `src/lib/constants.ts`

#### LEAD_STATUSES
Config لكل حالة:
- `label`, `colorClass`, `textClass`, `bgClass`

Mapping:
- NEW: أزرق
- CONTACTED: أصفر
- QUALIFIED: أخضر
- UNQUALIFIED: أحمر
- CONVERTED: بنفسجي

#### SCORE_COLORS
- 0–40: أحمر
- 41–70: أصفر
- 71–100: أخضر

---

### 1.3 Lead Utils

#### File
- `src/lib/lead-utils.ts`

Functions:
- `getScoreColor(score) → class`
- `getStatusConfig(status) → config`
- `formatRelativeTime(dateStr) → "2h ago" / "3d ago"`
- `groupLeadsByStatus(leads) → Record<Status, Lead[]>`

---

### 1.4 WhatsApp Helpers

#### File
- `src/lib/whatsapp.ts`

Functions:
- `sanitizePhoneForWhatsApp(phone)` → digits-only (بدون +)
- `buildWhatsAppUrl({ phone, firstName, companyName, quizTitle })`

Default template:

```text
Hi {firstName}, thanks for completing our {quizTitle} assessment!
```

---

### 1.5 React Query Provider

#### File
- `src/components/providers/query-provider.tsx`

Config:
- `staleTime: 30s`

---

## 2) Dashboard Shell Layout

### Architecture

`src/app/(dashboard)/layout.tsx` (Server Component)
- `getTenant()`
- fetch company name + lead count
- wraps children:
  - `<QueryProvider>`
  - `<DashboardShell>` (Client)

### Components (`src/components/layout/`)

| Component | Description |
|---|---|
| `dashboard-shell.tsx` | يدير sidebar state |
| `sidebar.tsx` | nav items + active highlighting |
| `sidebar-nav-item.tsx` | icon + label + badge + tooltip when collapsed |
| `mobile-sidebar.tsx` | Sheet للموبايل (< lg) |
| `top-navbar.tsx` | toggle + company name + theme + user |
| `user-nav.tsx` | Avatar + DropdownMenu (Profile, Sign out) |

### Sidebar Behavior
- Desktop: قابل للطي `w-64` ↔ `w-16`
- Mobile: Sheet
- Super Admin nav يظهر فقط إذا `role === SUPER_ADMIN`

### Hook
- `src/hooks/use-sidebar.ts`
- حالة الطي محفوظة في `localStorage`

---

## 3) Kanban Board (Leads)

### Data Flow

```text
leads/page.tsx (Server)
  → getTenant()
  → parse searchParams via URL
  → fetch leads + include { assignedTo, quiz }
  → fetch companyUsers (dropdown)
  → serialize Dates → ISO strings
  → LeadFilterBar (Client)
  → KanbanBoard (Client)
      → DndContext + closestCorners
      → KanbanColumn × 5
          → KanbanCard × n
      → DragOverlay
```

### 3.1 Leads Page (Server)

#### File
- `src/app/(dashboard)/leads/page.tsx`

#### Filters (searchParams)
- `assignee`
- `source`
- `scoreMin`, `scoreMax`
- `dateFrom`, `dateTo`

#### Query Rules
- Always scope by `companyId` from tenant
- Build dynamic `where` clause
- `include: { assignedTo: true, quiz: true }`

---

### 3.2 Kanban Board (Client)

#### File
- `src/components/leads/kanban-board.tsx`

#### dnd-kit setup
- `PointerSensor` with `activationConstraint: { distance: 8 }`
- `KeyboardSensor` (accessibility)
- `collisionDetection: closestCorners`

#### State
- `leadsByStatus: Record<Status, SerializedLead[]>`
- `activeCard: SerializedLead | null`
- `selectedLeads: Set<string>`

#### Optimistic Updates
- `handleDragOver`: move visually between columns
- `handleDragEnd`: call server action; revert on error

#### Bulk Selection
- checkbox per card
- shows `BulkActionsBar`

---

### 3.3 Kanban Column

#### File
- `src/components/leads/kanban-column.tsx`

- `useDroppable({ id: statusValue })`
- header: colored dot + label + count
- `ScrollArea` for list
- `isOver` highlight via ring

---

### 3.4 Kanban Card

#### File
- `src/components/leads/kanban-card.tsx`

- `useSortable({ id: lead.id })`
- Shows: name, company, score badge, source badge
- Footer: assigned avatar/unassigned, phone/email icons, relative time
- Click → opens `LeadDetailsModal`
- DragOverlay styling: `rotate-2`, `shadow-lg`

---

## 4) Lead Badges & Quick Actions

### Components

| Component | Description |
|---|---|
| `lead-score-badge.tsx` | Badge colored by score |
| `lead-source-badge.tsx` | Badge + icon by source (quiz/manual/import) |
| `lead-status-badge.tsx` | Badge colored by status |
| `whatsapp-button.tsx` | Green button opens wa.me in new tab |

---

## 5) Lead Details (Sheet Modal)

### File
- `src/components/leads/lead-details-modal.tsx`

### UX Decision
- **Sheet** (right slide-over) أفضل من Dialog بسبب كثافة المحتوى مع إبقاء Kanban في الخلفية.

### Fetching
- Uses React Query to fetch FullLead on open

### Layout
- `sm:max-w-[600px]`

```text
┌─ Header: Name + Avatar + Status badge + Score badge ─┐
├─ Contact: email (mailto) + phone (tel) + company     ─┤
├─ Actions: WhatsApp | Call | Email | Assign | Status  ─┤
├─ Tabs ────────────────────────────────────────────────┤
│  Details | Quiz Answers | Timeline | Deals | Notes    │
└───────────────────────────────────────────────────────┘
```

### Tabs

| Tab | Content |
|---|---|
| Details | Editable form (react-hook-form + zod) |
| Quiz Answers | Render quizResponses JSON as Q/A |
| Timeline | AuditLog entries for this lead |
| Deals | Related deals + Create Deal |
| Notes | Editable notes field |

### Quick Actions
- WhatsApp → `wa.me/{phone}?text=...`
- Call → `tel:{phone}`
- Email → `mailto:{email}`
- Assign → searchable dropdown (Command)
- Status → Select across 5 statuses

---

## 6) Server Actions (Leads)

### Folder
- `src/actions/leads/`

| Action | File | Description |
|---|---|---|
| getLeads(filters?) | `get-leads.ts` | Fetch leads with filters + tenant scoping |
| updateLeadStatus | `update-lead-status.ts` | Drag/drop status update; sets `convertedAt` |
| createLead | `create-lead.ts` | Manual create; validates assignee |
| updateLead | `update-lead.ts` | Update lead fields |
| assignLead | `assign-lead.ts` | Assign/unassign |
| bulkAssignLeads | `bulk-assign-leads.ts` | Bulk assign (MANAGER+) |
| bulkUpdateStatus | `bulk-update-status.ts` | Bulk status change (MANAGER+) |
| addLeadNote | `add-lead-note.ts` | Add/update notes |
| getLeadTimeline | `get-lead-timeline.ts` | Fetch AuditLog entries |

### Requirements for Each Action
- `getTenant()` + company scoping
- Zod validation
- Transaction: data mutation + AuditLog
- `revalidatePath("/leads")`

### Converted Logic
- Move to CONVERTED → `convertedAt = new Date()`
- Move away from CONVERTED → `convertedAt = null`

---

## 7) React Query Hooks

### Folder
- `src/hooks/`

| Hook | Description |
|---|---|
| `useLeads(filters?)` | `useQuery` + `staleTime: 30s` |
| `useLeadStatusMutation()` | `useMutation` + invalidate on success |
| `useAssignLeadMutation()` | Assign mutation |

---

## 8) Filter Bar + Bulk Actions

### 8.1 Lead Filter Bar

File: `src/components/leads/lead-filter-bar.tsx`
- Uses **nuqs** to manage URL search params
- Filters:
  - assignee (select)
  - source (select)
  - score range (min/max)
- “Clear filters” يظهر فقط عند وجود فلتر نشط
- URL shareable + survives refresh + SSR-friendly

### 8.2 Bulk Actions Bar

File: `src/components/leads/bulk-actions-bar.tsx`
- يظهر عند تحديد 1+ cards
- Actions:
  - Assign to... (select)
  - Change status... (select)
  - Clear selection
- Permission: MANAGER+

### 8.3 Create Lead Dialog

File: `src/components/leads/create-lead-dialog.tsx`
- Dialog + form (react-hook-form + zod)
- Fields:
  - firstName, lastName, email, phone, company
  - assignee
  - score
  - notes

---

## 9) File Tree (Phase 4)

```text
src/
├── types/lead.ts
├── lib/
│   ├── constants.ts
│   ├── lead-utils.ts
│   └── whatsapp.ts
├── hooks/
│   ├── use-leads.ts
│   ├── use-lead-mutation.ts
│   └── use-sidebar.ts
├── components/
│   ├── providers/query-provider.tsx
│   ├── layout/
│   │   ├── dashboard-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── sidebar-nav-item.tsx
│   │   ├── mobile-sidebar.tsx
│   │   ├── top-navbar.tsx
│   │   └── user-nav.tsx
│   └── leads/
│       ├── kanban-board.tsx
│       ├── kanban-column.tsx
│       ├── kanban-card.tsx
│       ├── kanban-card-skeleton.tsx
│       ├── lead-filter-bar.tsx
│       ├── lead-details-modal.tsx
│       ├── lead-details-header.tsx
│       ├── lead-details-contact.tsx
│       ├── lead-details-actions.tsx
│       ├── lead-tab-details.tsx
│       ├── lead-tab-quiz.tsx
│       ├── lead-tab-timeline.tsx
│       ├── lead-tab-deals.tsx
│       ├── lead-tab-notes.tsx
│       ├── lead-score-badge.tsx
│       ├── lead-source-badge.tsx
│       ├── lead-status-badge.tsx
│       ├── create-lead-dialog.tsx
│       ├── bulk-actions-bar.tsx
│       ├── assign-lead-dropdown.tsx
│       └── whatsapp-button.tsx
├── actions/leads/
│   ├── get-leads.ts
│   ├── update-lead-status.ts
│   ├── create-lead.ts
│   ├── update-lead.ts
│   ├── assign-lead.ts
│   ├── bulk-assign-leads.ts
│   ├── bulk-update-status.ts
│   ├── add-lead-note.ts
│   └── get-lead-timeline.ts
└── app/(dashboard)/
    ├── layout.tsx
    └── leads/
        ├── page.tsx
        └── loading.tsx
```

- **New files**: ~40
- **Modified**: 2–3

---

## 10) Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Details UI | Sheet | محتوى كثير + إبقاء Kanban بالخلف |
| Filters | URL (nuqs) | Shareable + survives refresh + SSR-friendly |
| Drag UX | Optimistic | fast UI + revert on error |
| Bulk permission | MANAGER+ | منع تغييرات جماعية للموظفين |
| Date serialization | ISO strings | RSC/Client boundary compatibility |

---

## 11) Verification Checklist

- [ ] Dashboard shell: Sidebar collapse/expand + Mobile Sheet
- [ ] Kanban: Drag NEW → QUALIFIED → optimistic update + success toast
- [ ] Revert: simulate failure → card reverts + error toast
- [ ] Details Sheet: open card → tabs load + actions work
- [ ] WhatsApp: opens wa.me with prefilled text
- [ ] Filters: change filter → URL updates → refresh persists
- [ ] Create: Add Lead → appears in NEW
- [ ] Bulk: select 3 → assign to Sarah → all update
- [ ] Timeline: status change logged and visible
- [ ] CONVERTED: moved in/out sets/clears `convertedAt`
- [ ] Tenant isolation: different company cannot see others
- [ ] Responsive: Kanban horizontal scroll on mobile

---

✅ **Phase 4 complete when all verification items pass.**

