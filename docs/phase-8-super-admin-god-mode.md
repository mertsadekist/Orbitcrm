# Phase 8: Super Admin Dashboard — *God Mode*
> ملف تشغيل خطوة-بخطوة داخل Visual Studio Code (Markdown)

---

## ✅ هدف المرحلة
بناء لوحة تحكم **Super Admin** لعرض وإدارة جميع الشركات (Tenants) داخل المنصة، تشمل:
- قائمة الشركات مع **حصص (Quotas)** + حالة التفعيل + إحصائيات
- **Global Stats** شاملة للنظام
- **System Logs** (AuditLog عبر كل الشركات)
- **Impersonation (Login As)** للدعم الفني

### قيود وأمان
- الوصول محصور حصراً بدور: `SUPER_ADMIN` المرتبط بشركة `PLATFORM`
- **تمييز بصري** واضح (Indigo/Purple Header + Badge دائم "Super Admin")
- **Impersonation = Read-only دائماً**
- أي جلسة انتحال تُسجّل في `AuditLog`، وتمنع أي عمليات كتابة (CREATE/UPDATE/DELETE)

---

## 0) المتطلبات قبل البدء
- Prisma + Next.js App Router
- نظام Auth/JWT موجود (Phase 2/4/7 حسب مشروعك)
- جدول AuditLog موجود (Phase 7)
- Shadcn UI + Tailwind جاهزين

---

## 1) Schema Updates (prisma/schema.prisma)
### 1.1 تحديث نموذج Company
- [ ] أضف الحقول التالية داخل `model Company`:

```prisma
maxQuizzes   Int      @default(10)     // حد الاستبيانات
notes        String?  @db.Text         // ملاحظات Super Admin
```

### 1.2 تحديث نموذج User
- [ ] أضف الحقل التالي داخل `model User`:

```prisma
impersonatedBy  String?   // userId الذي ينتحل الشخصية (null = طبيعي)
```

### 1.3 Migration
- [ ] نفّذ:
```bash
npx prisma migrate dev -n phase8_super_admin
npx prisma generate
```

---

## 2) TypeScript Types (src/types/super-admin.ts)
- [ ] أنشئ الملف: `src/types/super-admin.ts`
- [ ] الصق:

```ts
// src/types/super-admin.ts
import type { ChartDataPoint } from "@/types/analytics"; // أو أنشئ type بسيط مماثل
import type { PlanType } from "@/types/billing"; // عدّل حسب مشروعك

export interface CompanyWithStats {
  id: string;
  subscriptionId: string;
  name: string;
  slug: string;
  plan: PlanType;
  maxUsers: number;
  maxQuizzes: number;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;

  _count: {
    users: number;
    leads: number;
    deals: number;
    quizzes: number;
  };

  activeUsers: number;
  revenue: number; // sum(CLOSED_WON deals.value)
}

export interface GlobalStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;

  companiesGrowth: ChartDataPoint[];
  leadsGrowth: ChartDataPoint[];
}

export interface ImpersonationSession {
  originalUserId: string;
  targetCompanyId: string;
  targetCompanyName: string;
  startedAt: string;
  isReadOnly: true;
}
```

---

## 3) Super Admin Route Group + Layout
### 3.1 المسارات
نستخدم Route Group مستقل:
- `/super-admin/companies`
- `/super-admin/stats`
- `/super-admin/logs`

> ملاحظة: في هيكل المرحلة أدناه يوجد `app/(super-admin)/super-admin/...`  
> الأفضل عملياً: **app/(super-admin)/(admin)/companies** أو **app/(super-admin)/companies**.  
> التزم بما هو مناسب لمشروعك، لكن حافظ على `layout.tsx` تحت `(super-admin)`.

### 3.2 إنشاء Layout (Server Component)
- [ ] أنشئ: `src/app/(super-admin)/layout.tsx`
- [ ] منطق الحماية:
  - `getTenant()` → إذا `role !== "SUPER_ADMIN"` → `redirect("/dashboard")`
- [ ] تمييز بصري:
  - Header gradient بنفسجي/indigo
  - Badge دائم "Super Admin"
  - ضع `data-admin="true"` على `<html>` لتفعيل overrides

**مثال Layout:**
```tsx
// src/app/(super-admin)/layout.tsx
import { redirect } from "next/navigation";
import AdminShell from "@/components/super-admin/admin-shell";
import { getTenant } from "@/lib/get-tenant"; // عدّل حسب مشروعك

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();

  if (tenant.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <html lang="en" data-admin="true">
      <body>
        <AdminShell tenant={tenant}>{children}</AdminShell>
      </body>
    </html>
  );
}
```

---

## 4) Super Admin Shell Components
- [ ] أنشئ مجلد: `src/components/super-admin/`

### 4.1 admin-shell.tsx (Client)
- نفس DashboardShell ولكن:
  - ألوان مختلفة
  - Sidebar عناصر Super Admin
  - Navbar يظهر Badge "Super Admin"
  - إذا كان في impersonation → زر "Back to Dashboard" + Banner

```tsx
// src/components/super-admin/admin-shell.tsx
"use client";

import AdminNavbar from "./admin-navbar";
import AdminSidebar from "./admin-sidebar";

export default function AdminShell({ children, tenant }: any) {
  return (
    <div className="min-h-screen">
      <AdminNavbar tenant={tenant} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 4.2 admin-navbar.tsx
- يعرض: `OrbitFlow Admin` + Badge
- Indigo/Purple header

### 4.3 admin-sidebar.tsx
| Item | Icon | Route |
|---|---|---|
| Companies | Building2 | /super-admin/companies |
| Global Stats | BarChart3 | /super-admin/stats |
| System Logs | ScrollText | /super-admin/logs |

---

## 5) Server Actions (src/actions/super-admin/)
> قاعدة ذهبية: **SUPER_ADMIN فقط**  
> وأثناء impersonation: **Read-only** (رفض أي كتابة).

- [ ] أنشئ المجلد: `src/actions/super-admin/`

### 5.1 Helpers مطلوبة
- `getTenant()` يجب أن يُرجع:
  - `companyId`, `role`
  - `isImpersonating: boolean`
  - `originalCompanyId?: string`

- `requireSuperAdmin(tenant)` → يرمي error أو redirect
- `assertNotImpersonating(tenant)` → يمنع الكتابة

**مثال:**
```ts
function requireSuperAdmin(t: any) {
  if (t.role !== "SUPER_ADMIN" || t.companyId !== "PLATFORM") {
    throw new Error("Forbidden");
  }
}
function assertNotImpersonating(t: any) {
  if (t.isImpersonating) throw new Error("Read-only during impersonation");
}
```

---

## 6) get-companies.ts — جلب كل الشركات
- [ ] أنشئ: `src/actions/super-admin/get-companies.ts`

**المطلوب:**
- استثناء شركة المنصة: `subscriptionId !== "PLATFORM"`
- include `_count`
- حساب `activeUsers` و `revenue`

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/get-tenant";
import type { CompanyWithStats } from "@/types/super-admin";

export async function getCompanies(): Promise<CompanyWithStats[]> {
  const tenant = await getTenant();
  // requireSuperAdmin(tenant);

  const companies = await prisma.company.findMany({
    where: { NOT: { subscriptionId: "PLATFORM" } },
    include: { _count: { select: { users: true, leads: true, deals: true, quizzes: true } } },
    orderBy: { createdAt: "desc" },
  });

  // revenue + activeUsers لكل شركة (بشكل متوازي لتقليل الوقت)
  const enriched = await Promise.all(
    companies.map(async (c) => {
      const [activeUsers, revenueAgg] = await Promise.all([
        prisma.user.count({ where: { companyId: c.id, isActive: true } as any }),
        prisma.deal.aggregate({
          where: { companyId: c.id, stage: "CLOSED_WON" as any } as any,
          _sum: { value: true },
        }),
      ]);

      return {
        id: c.id,
        subscriptionId: c.subscriptionId,
        name: c.name,
        slug: c.slug,
        plan: c.plan as any,
        maxUsers: c.maxUsers,
        maxQuizzes: c.maxQuizzes,
        isActive: c.isActive,
        notes: c.notes,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        _count: {
          users: c._count.users,
          leads: c._count.leads,
          deals: c._count.deals,
          quizzes: c._count.quizzes,
        },
        activeUsers,
        revenue: Number(revenueAgg._sum.value ?? 0),
      } satisfies CompanyWithStats;
    })
  );

  return enriched;
}
```

---

## 7) update-company-quotas.ts — تعديل الحصص والخطة
- [ ] أنشئ: `src/actions/super-admin/update-company-quotas.ts`

**المتطلبات:**
- Zod validation:
  - `maxUsers: 1-1000`
  - `maxQuizzes: 1-500`
  - `plan` valid
- لا تقل الحصة عن الاستخدام الحالي
- `$transaction`:
  1) Update Company
  2) AuditLog (old/new)

```ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/get-tenant";

const Schema = z.object({
  companyId: z.string().min(1),
  plan: z.string().min(1),
  maxUsers: z.number().int().min(1).max(1000),
  maxQuizzes: z.number().int().min(1).max(500),
});

export async function updateCompanyQuotas(input: unknown) {
  const tenant = await getTenant();
  // requireSuperAdmin(tenant);
  // assertNotImpersonating(tenant);

  const data = Schema.parse(input);

  const company = await prisma.company.findUnique({ where: { id: data.companyId } });
  if (!company) throw new Error("Company not found");
  if (company.subscriptionId === "PLATFORM") throw new Error("Cannot edit PLATFORM");

  const [currentUsers, currentQuizzes] = await Promise.all([
    prisma.user.count({ where: { companyId: data.companyId } }),
    prisma.quiz.count({ where: { companyId: data.companyId } }),
  ]);

  if (data.maxUsers < currentUsers) throw new Error("maxUsers cannot be below current usage");
  if (data.maxQuizzes < currentQuizzes) throw new Error("maxQuizzes cannot be below current usage");

  await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: data.companyId },
      data: { plan: data.plan as any, maxUsers: data.maxUsers, maxQuizzes: data.maxQuizzes },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE_COMPANY_QUOTAS",
        companyId: "PLATFORM",
        targetCompanyId: data.companyId,
        meta: {
          old: { plan: company.plan, maxUsers: company.maxUsers, maxQuizzes: company.maxQuizzes },
          new: { plan: data.plan, maxUsers: data.maxUsers, maxQuizzes: data.maxQuizzes },
        },
      } as any,
    });
  });

  return { success: true };
}
```

---

## 8) toggle-company-status.ts — تفعيل/تعطيل شركة
- [ ] أنشئ: `src/actions/super-admin/toggle-company-status.ts`

**المتطلبات:**
- لا يسمح لشركة PLATFORM
- Update `isActive` + AuditLog
- عند التعطيل: منع login في auth.ts

---

## 9) update-company-notes.ts — ملاحظات Super Admin
- [ ] أنشئ: `src/actions/super-admin/update-company-notes.ts`
- Update `notes` + AuditLog

---

## 10) get-global-stats.ts — إحصائيات النظام الشاملة
- [ ] أنشئ: `src/actions/super-admin/get-global-stats.ts`

**المتطلبات:**
- بدون `companyId` filter
- totalRevenue = sum value لـ `CLOSED_WON`
- growth charts آخر 12 شهر (groupBy month)

> ملاحظة: GroupBy شهرياً قد يحتاج `prisma.$queryRaw` حسب قاعدة البيانات.

---

## 11) Impersonation System
### 11.1 بدء الانتحال impersonate-company.ts
- [ ] أنشئ: `src/actions/super-admin/impersonate-company.ts`

**التدفق:**
1) Super Admin فقط
2) جلب أول OWNER للشركة المستهدفة (أو user افتراضي للدخول)
3) إنشاء Session/JWT token خاص:
   - `companyId = targetCompanyId`
   - `role` يبقى `SUPER_ADMIN`
   - `impersonating = true`
   - `originalCompanyId = "PLATFORM"`
   - `originalUserId = SUPER_ADMIN userId`
4) AuditLog: `IMPERSONATE`
5) Redirect → `/dashboard`

### 11.2 إيقاف الانتحال stop-impersonation.ts
- [ ] أنشئ: `src/actions/super-admin/stop-impersonation.ts`

**التدفق:**
1) إعادة session لـ PLATFORM
2) AuditLog: `STOP_IMPERSONATE`
3) Redirect → `/super-admin/companies`

---

## 12) تعديل auth.ts / JWT Callback + getTenant()
### 12.1 JWT callback (فكرة عامة)
- إذا `token.impersonating === true`:
  - `token.companyId = targetCompanyId`
  - `token.originalCompanyId = "PLATFORM"`
  - `token.role` يبقى `SUPER_ADMIN`

### 12.2 getTenant()
- [ ] أضف:
  - `isImpersonating: boolean`
  - `originalCompanyId?: string`
  - `originalUserId?: string`

### 12.3 حماية الكتابة أثناء الانتحال (Mandatory)
- [ ] في كل Server Action للـ dashboard العادي:
  - إذا `tenant.isImpersonating` → ارفض أي `CREATE/UPDATE/DELETE`

---

## 13) Impersonation Banner (Client)
- [ ] أنشئ: `src/components/super-admin/impersonation-banner.tsx`

**الشريط يظهر أعلى صفحات dashboard أثناء الانتحال:**
> ⚠️ You are viewing as: Acme Corporation (...) — Read-only mode  [Stop Impersonation]

- [ ] تعديل `(dashboard)/layout.tsx`:
  - إذا `isImpersonating` → اعرض Banner فوق المحتوى

---

## 14) Companies Page
### 14.1 Page (Server Component)
- [ ] أنشئ: `src/app/(super-admin)/super-admin/companies/page.tsx`
- يجلب `getCompanies()` ويمررها لـ Table Client

### 14.2 companies-table.tsx (Client)
- [ ] أنشئ: `src/components/super-admin/companies-table.tsx`

**الأعمدة:**
- Company
- Subscription
- Plan
- Users (active/max)
- Leads
- Revenue
- Status
- Actions:
  - ⚙️ → Company Details Sheet
  - 👤 → Login As (فقط إذا الشركة نشطة)

### 14.3 company-search.tsx (Client)
- بحث debounced (اسم/Subscription)
- Filters:
  - plan
  - status (active/disabled)

---

## 15) Company Details Sheet + Quota Editor
- [ ] أنشئ:
  - `src/components/super-admin/company-details-sheet.tsx`
  - `src/components/super-admin/quota-editor.tsx`

**Tabs:**
- Overview
- Quotas (تعديل maxUsers/maxQuizzes/plan)
- Users (read-only)
- Notes (textarea)

**قواعد Quota:**
- الحد الأدنى = الاستخدام الحالي (لا يسمح بالنقصان أدنى من الحالي)

---

## 16) Global Stats Page
- [ ] أنشئ:
  - `src/app/(super-admin)/super-admin/stats/page.tsx`
  - `src/components/super-admin/global-stats-grid.tsx`
  - `src/components/super-admin/growth-charts.tsx`
  - `src/components/super-admin/plan-distribution-chart.tsx`

**KPIs (6 Cards):**
- Total Companies
- Active Companies
- Total Users
- Total Leads
- Total Deals
- Total Revenue

**Charts:**
- Companies Growth (Area) آخر 12 شهر
- Leads Growth (Area) آخر 12 شهر
- Plan Distribution (Donut)

---

## 17) System Logs (AuditLog Across Tenants)
- [ ] أنشئ:
  - `src/app/(super-admin)/super-admin/logs/page.tsx`
  - `src/components/super-admin/system-logs-table.tsx`

**المتطلبات:**
- Pagination
- Filters:
  - company
  - action
  - date range
- عمود إضافي: Company

---

## 18) تعديل Sidebar + Dashboard Behavior
### 18.1 Sidebar (Phase 4)
- إذا `role === "SUPER_ADMIN"` **وليس impersonating**:
  - أظهر قسم Admin + روابط Super Admin
- إذا `impersonating`:
  - أظهر sidebar العادي (لأنه يرى بيانات الشركة المستهدفة)

### 18.2 تفعيل منع تسجيل الدخول لشركة معطلة
- [ ] في auth/login flow:
  - إذا `company.isActive === false` → منع تسجيل الدخول

---

## 19) هيكل الملفات النهائي (Phase 8)
```
src/
├── types/super-admin.ts
├── actions/super-admin/
│   ├── get-companies.ts
│   ├── update-company-quotas.ts
│   ├── toggle-company-status.ts
│   ├── get-global-stats.ts
│   ├── update-company-notes.ts
│   ├── impersonate-company.ts
│   └── stop-impersonation.ts
├── components/super-admin/
│   ├── admin-shell.tsx
│   ├── admin-navbar.tsx
│   ├── admin-sidebar.tsx
│   ├── companies-table.tsx
│   ├── company-search.tsx
│   ├── company-details-sheet.tsx
│   ├── quota-editor.tsx
│   ├── global-stats-grid.tsx
│   ├── growth-charts.tsx
│   ├── plan-distribution-chart.tsx
│   ├── system-logs-table.tsx
│   └── impersonation-banner.tsx
└── app/(super-admin)/
    ├── layout.tsx
    └── super-admin/
        ├── companies/page.tsx
        ├── stats/page.tsx
        └── logs/page.tsx
```

---

## 20) Verification Checklist (التحقق)
- [ ] Guard: أي Role غير SUPER_ADMIN يذهب `/dashboard`
- [ ] Visual: Header indigo + Badge "Super Admin" دائم
- [ ] Companies: Super Admin يرى كل الشركات (عدا PLATFORM) + stats
- [ ] Quotas: تعديل maxUsers/maxQuizzes/plan يحفظ + AuditLog
- [ ] Quota Min: تقليل أقل من الاستخدام الحالي مرفوض
- [ ] Deactivate Company: الشركة تتعطل + المستخدمون لا يستطيعون الدخول
- [ ] Global Stats: الأرقام تساوي مجموع كل الشركات
- [ ] Growth Charts: آخر 12 شهر بشكل صحيح
- [ ] Impersonate: Login As → Dashboard + Banner + Read-only
- [ ] Read-only: محاولة Create Lead أثناء الانتحال → مرفوض
- [ ] Stop: Stop Impersonation → رجوع `/super-admin/companies`
- [ ] Logs: AuditLog لكل الشركات + عمود Company + فلاتر
- [ ] Search: البحث بـ اسم/Subscription يعمل فوراً (debounced)
- [ ] Notes: إضافة ملاحظة تحفظ وتظهر

---

### ✅ انتهى
نفّذ القائمة خطوة-بخطوة داخل VS Code، وطبّق قواعد الأمان (Read-only أثناء الانتحال) كشرط أساسي.
