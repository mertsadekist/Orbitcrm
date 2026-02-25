# Phase 9: System Reliability, PWA & Polish — *Production Readiness*
> ملف تشغيل خطوة-بخطوة داخل Visual Studio Code (Markdown)

---

## ✅ هدف المرحلة
تحويل التطبيق من **MVP** إلى منتج جاهز للإنتاج عبر:
- معالجة أخطاء شاملة (**SystemLog + Error Handling + Error Boundaries**)
- تحويل التطبيق إلى **PWA**
- نظام **Backup** كامل لبيانات الشركة (ZIP)
- تحسين **Loading/Skeleton** و **Toasts**
- تحسينات أداء (React Query / Next / Prisma)
- **اختبار E2E** للتدفق الكامل من البداية للنهاية

---

## 0) المتطلبات قبل البدء
- Next.js App Router + TypeScript
- Prisma + DB جاهزين
- Sonner (toasts) موجود
- AuditLog موجود (Phase 7)
- Super Admin (Phase 8) جاهز (لاختبار E2E)

---

## 1) تثبيت Dependencies (مرة واحدة)
> نفّذ داخل Terminal في VS Code من جذر المشروع

- [ ] تثبيت PWA:
```bash
npm install next-pwa
```

- [ ] تثبيت archiver لملفات ZIP:
```bash
npm install archiver
npm install --save-dev @types/archiver
```

---

## 2) Schema Update — SystemLog (prisma/schema.prisma)
- [ ] أضف نموذج جديد:

```prisma
model SystemLog {
  id         String   @id @default(cuid())
  level      String   // "ERROR" | "WARN" | "INFO"
  message    String   @db.Text
  stack      String?  @db.Text
  source     String   // "SERVER_ACTION" | "API_ROUTE" | "MIDDLEWARE" | "CLIENT"
  endpoint   String?  // المسار أو اسم الإجراء
  userId     String?
  companyId  String?
  metadata   Json?    // معلومات إضافية (request body, headers, etc.)
  createdAt  DateTime @default(now())

  @@index([level])
  @@index([source])
  @@index([createdAt])
  @@index([companyId])
  @@map("system_logs")
}
```

- [ ] Migration:
```bash
npx prisma migrate dev -n phase9_system_log
npx prisma generate
```

> ✅ ملاحظة: لا توجد علاقات (SystemLog مستقل تماماً).

---

## 3) Global Error Handling (src/lib/error-handler.ts)
### 3.1 إنشاء الملف
- [ ] أنشئ: `src/lib/error-handler.ts`

### 3.2 AppError + logError + withErrorHandling
> هدف هذا الملف: **نمط موحد** لالتقاط الأخطاء + تسجيلها في `SystemLog` وإرجاع Response قياسي من Server Actions.

```ts
// src/lib/error-handler.ts
import { prisma } from "@/lib/prisma"; // عدّل حسب مشروعك

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "INTERNAL_ERROR";

export type LogSource = "SERVER_ACTION" | "API_ROUTE" | "MIDDLEWARE" | "CLIENT";

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

export async function logError(
  error: Error,
  context: {
    level?: "ERROR" | "WARN" | "INFO";
    source: LogSource;
    endpoint?: string;
    userId?: string;
    companyId?: string;
    metadata?: unknown;
  }
): Promise<string> {
  const level = context.level ?? "ERROR";

  const row = await prisma.systemLog.create({
    data: {
      level,
      message: error.message ?? "Unknown error",
      stack: (error as any)?.stack ?? null,
      source: context.source,
      endpoint: context.endpoint ?? null,
      userId: context.userId ?? null,
      companyId: context.companyId ?? null,
      metadata: context.metadata as any,
    },
    select: { id: true },
  });

  return row.id;
}

function normalizeError(err: unknown): { message: string; code: ErrorCode; status: number; isOperational: boolean } {
  if (err instanceof AppError) {
    return { message: err.message, code: err.code, status: err.statusCode, isOperational: err.isOperational };
  }
  if (err instanceof Error) {
    return { message: "Unexpected error occurred", code: "INTERNAL_ERROR", status: 500, isOperational: false };
  }
  return { message: "Unexpected error occurred", code: "INTERNAL_ERROR", status: 500, isOperational: false };
}

// غلاف لـ Server Actions (يلتقط الأخطاء تلقائياً)
export async function withErrorHandling<T>(
  actionName: string,
  action: () => Promise<T>,
  ctx?: { userId?: string; companyId?: string; metadata?: unknown }
): Promise<ActionResult<T> & { errorId?: string }> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (err) {
    const n = normalizeError(err);
    const error = err instanceof Error ? err : new Error(String(err));

    const errorId = await logError(error, {
      source: "SERVER_ACTION",
      endpoint: actionName,
      userId: ctx?.userId,
      companyId: ctx?.companyId,
      metadata: ctx?.metadata,
      level: n.code === "INTERNAL_ERROR" ? "ERROR" : "WARN",
    });

    return { success: false, error: n.message, code: n.code, errorId };
  }
}
```

### 3.3 نمط الاستخدام في Server Actions
- [ ] استبدل:
```ts
export async function createLead(data: CreateLeadInput) {
  const tenant = await getTenant();
  return prisma.lead.create({ ... });
}
```

- [ ] بـ:
```ts
import { withErrorHandling } from "@/lib/error-handler";

export async function createLead(data: CreateLeadInput) {
  return withErrorHandling("createLead", async () => {
    const tenant = await getTenant();
    return prisma.lead.create({ ... });
  }, { userId: tenant.userId, companyId: tenant.companyId, metadata: { input: data } });
}
```

---

## 4) React Error Boundaries + Error Pages
### 4.1 Error Boundary (Client)
- [ ] أنشئ: `src/components/error/error-boundary.tsx`

**المتطلبات:**
- class component
- يرسل الخطأ إلى `/api/log-error`
- يعرض fallback UI

```tsx
// src/components/error/error-boundary.tsx
"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = { hasError: boolean; errorId?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      const res = await fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          source: "CLIENT",
          url: window.location.href,
          componentStack: info.componentStack,
        }),
      });
      const data = await res.json();
      this.setState({ errorId: data?.errorId });
    } catch {
      // swallow
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border p-6">
            <div className="text-lg font-semibold">⚠️ Something went wrong</div>
            <div className="mt-2 text-sm text-muted-foreground">
              We've been notified. Please try again.
            </div>
            {this.state.errorId && (
              <div className="mt-3 text-xs text-muted-foreground">Error ID: {this.state.errorId}</div>
            )}
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

### 4.2 Global Error Page (App Router)
- [ ] أنشئ: `src/app/error.tsx`

```tsx
"use client";

import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg p-10 text-center">
      <div className="text-4xl">⚠️</div>
      <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        We've been notified and are working on fixing this issue.
      </p>

      <div className="mt-6 flex justify-center gap-3">
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => reset()}>
          Try Again
        </button>
        <Link className="rounded-md border px-4 py-2" href="/dashboard">
          Go to Dashboard
        </Link>
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        Error ID: {error?.digest ?? "unknown"}
      </div>
    </div>
  );
}
```

### 4.3 Custom 404 Page
- [ ] أنشئ: `src/app/not-found.tsx`

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-10 text-center">
      <div className="text-4xl">🔍</div>
      <h1 className="mt-4 text-2xl font-semibold">Page Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6">
        <Link className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/dashboard">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
```

### 4.4 Route-Level Errors (Dashboard)
- [ ] أضف:
  - `src/app/(dashboard)/error.tsx`
  - `src/app/(dashboard)/leads/error.tsx`
  - `src/app/(dashboard)/pipeline/error.tsx`
> نفس النمط لكن يحافظ على DashboardShell + زر retry.

---

## 5) API Route — Client Error Logging
- [ ] أنشئ: `src/app/api/log-error/route.ts`

```ts
// src/app/api/log-error/route.ts
import { NextResponse } from "next/server";
import { logError } from "@/lib/error-handler";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const error = new Error(body?.message ?? "Client error");
  (error as any).stack = body?.stack;

  const errorId = await logError(error, {
    source: "CLIENT",
    endpoint: body?.url,
    metadata: {
      componentStack: body?.componentStack,
      url: body?.url,
    },
  });

  return NextResponse.json({ logged: true, errorId });
}
```

> ✅ لا يحتاج auth لأن الخطأ قد يحصل قبل auth.

---

## 6) Server Actions Wrapping (Mandatory)
- [ ] لف **كل** Server Actions بـ `withErrorHandling` وأعد نمط الاستجابة:
```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }
```

### 6.1 قائمة المجلدات المطلوب تعديلها
| Folder | Files |
|---|---:|
| src/actions/leads/ | 9 |
| src/actions/deal/ | 4 |
| src/actions/quiz/ | 2 |
| src/actions/users/ | 7 |
| src/actions/analytics/ | 3 |
| src/actions/super-admin/ | 7 |

- [ ] قاعدة: أي Action تقوم بـ write تُضيف أيضاً:
  - `assertNotImpersonating(tenant)` (Phase 8)

---

## 7) PWA Configuration
### 7.1 next.config.mjs
- [ ] عدّل `next.config.mjs` لإضافة `next-pwa`:

```js
import withPWA from "next-pwa";

const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})({
  // existing next config هنا
});

export default config;
```

### 7.2 manifest.json
- [ ] أنشئ: `public/manifest.json`

```json
{
  "name": "OrbitFlow CRM",
  "short_name": "OrbitFlow",
  "description": "SaaS CRM & Lead Generation Platform",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 7.3 app metadata (src/app/layout.tsx)
- [ ] أضف metadata:

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "OrbitFlow" },
};
```

### 7.4 Icons
- [ ] أنشئ: `public/icons/` وضع الملفات:
  - `icon-192.png`
  - `icon-512.png`
  - `icon-maskable-512.png`
  - `apple-touch-icon.png` (180x180)
  - `favicon.ico`
  - `favicon-16x16.png`
  - `favicon-32x32.png`

---

## 8) PWA Install Prompt (Client)
- [ ] أنشئ: `src/components/pwa/install-prompt.tsx`

**المتطلبات:**
- يلتقط `beforeinstallprompt`
- Banner غير مزعج + زر Install + Dismiss
- Dismiss يُخزن في localStorage

---

## 9) Backup System (ZIP)
### 9.1 API Route — Export ZIP
- [ ] أنشئ: `src/app/api/backup/export/route.ts`

**GET /api/backup/export**
- متطلبات: `OWNER+` (عبر `getTenantOrNull`)
- يجلب بيانات الشركة كاملة
- يبني JSON
- يضغط ZIP عبر `archiver`
- يرجع ZIP stream مع headers

### 9.2 export-company-data.ts
- [ ] أنشئ: `src/lib/backup/export-company-data.ts`

**مهم:**
- بدون `passwordHash` أو أسرار
- `Promise.all` لجلب البيانات بالتوازي
- `auditLogs` limit 10000

### 9.3 zip-builder.ts
- [ ] أنشئ: `src/lib/backup/zip-builder.ts`

**ZIP يحتوي:**
- `data.json` (البيانات الكاملة)
- `metadata.json` (version + exportedAt + stats)
- `summary.txt` (ملخص مقروء)

### 9.4 Settings UI — Backup Section
- [ ] أنشئ: `src/components/settings/backup-section.tsx`
- [ ] أضف صفحة:
  - `src/app/(dashboard)/settings/backup/page.tsx`

**UI:**
- زر Download Backup
- Loading state + progress indicator
- تخزين آخر Backup date في localStorage
- OWNER+ فقط

---

## 10) Loading & Skeleton States
### 10.1 Per-route loading.tsx
- [ ] أضف/حسّن `loading.tsx` للمسارات:

| Route | Skeleton |
|---|---|
| /dashboard | 6 stat cards + chart placeholders |
| /leads | 5 kanban columns + card skeletons |
| /pipeline | 6 pipeline columns + card skeletons |
| /analytics | query builder + 6 cards + 3 charts |
| /settings/users | table skeleton |
| /settings/audit-log | table skeleton |
| /super-admin/companies | table skeleton |
| /super-admin/stats | 6 cards + 2 charts |

### 10.2 Skeleton Component
- [ ] أنشئ: `src/components/ui/skeleton-card.tsx`
- Skeleton قابل لإعادة الاستخدام مع pulse animation

---

## 11) Toast Notifications Polish (Sonner)
- [ ] طبّق قواعد التوست:
  - Success: ✓ أخضر — 3s
  - Error: ✕ أحمر — 5s + زر Retry إذا ممكن
  - Warning: ⚠ أصفر — 10s
- [ ] اجعل الرسائل قصيرة وواضحة وموحدة

---

## 12) Performance Optimizations
### 12.1 React Query Defaults (query-provider.tsx)
- [ ] عدّل defaults:

```ts
staleTime: 30_000,
gcTime: 5 * 60_000,
refetchOnWindowFocus: false,
retry: 1,
```

### 12.2 Next.js
- [ ] loading.tsx لكل route (instant navigation feel)
- [ ] generateStaticParams حيث ممكن
- [ ] next/image + sizes
- [ ] next/font/google (Inter)

### 12.3 Prisma
- [ ] استخدم `select` بدل `include` عند عدم الحاجة
- [ ] Connection pooling في prisma.ts
- [ ] مراجعة Indexes: أي where filter مهم يجب أن يكون مُفهرس

---

## 13) Final Testing Checklist (End-to-End)
نفّذ هذا السيناريو بالكامل:

1. 🏢 Super Admin → Create Company  
2. 👤 Owner → Create Users (Manager + Employees)  
3. 📝 Manager → Create Quiz → Publish  
4. 🌐 Public → Submit Quiz → Lead يظهر في Kanban  
5. 📋 Sales → Manage Lead (Drag + Notes + WhatsApp + Assign)  
6. 🏆 Close Deal (CLOSED_WON) + Commissions created  
7. 💰 Owner → Approve/Pay Commissions  
8. 📊 Manager → Analytics + Export CSV  
9. ⚙️ Owner → Users permissions + deactivate user + quota bars  
10. 🔒 Super Admin → Global stats + impersonate read-only + stop + owner backup ZIP  
11. ⚡ Error Handling: قطع DB → Error page + SystemLog + Retry  
12. 📱 PWA: Install + standalone + offline cached page + dark mode

---

## 14) هيكل الملفات النهائي (Phase 9)
```
prisma/
│   └── schema.prisma                            # + SystemLog model
src/
├── lib/
│   ├── error-handler.ts                         # AppError, logError, withErrorHandling
│   └── backup/
│       ├── export-company-data.ts               # Fetch all company data
│       └── zip-builder.ts                       # Build ZIP stream
├── components/
│   ├── error/
│   │   └── error-boundary.tsx                   # React Error Boundary
│   ├── pwa/
│   │   └── install-prompt.tsx                   # PWA install banner
│   ├── settings/
│   │   └── backup-section.tsx                   # Backup download UI
│   └── ui/
│       └── skeleton-card.tsx                    # Reusable skeleton
├── app/
│   ├── error.tsx                                # Global error page
│   ├── not-found.tsx                            # Custom 404
│   ├── (dashboard)/
│   │   ├── error.tsx                            # Dashboard error
│   │   ├── leads/error.tsx                      # Leads error
│   │   ├── pipeline/error.tsx                   # Pipeline error
│   │   └── settings/backup/page.tsx             # Backup page
│   └── api/
│       ├── log-error/route.ts                   # Client error logging
│       └── backup/export/route.ts               # ZIP backup download
└── public/
    ├── manifest.json                            # PWA manifest
    └── icons/                                   # PWA icons (6 files)
        ├── icon-192.png
        ├── icon-512.png
        ├── icon-maskable-512.png
        ├── apple-touch-icon.png
        ├── favicon-16x16.png
        └── favicon-32x32.png
```

---

## 15) Verification Checklist (التحقق)
- [ ] Error Boundary: تعطيل DB → /leads → Error page يظهر (ليس شاشة بيضاء)
- [ ] SystemLog: الخطأ مسجّل مع stack trace + source/endpoint
- [ ] Error Recovery: Try Again يعمل بعد إصلاح السبب
- [ ] 404 Page: /nonexistent → صفحة مخصصة
- [ ] Client Error: throw error في مكون → يُسجّل عبر API route
- [ ] PWA Manifest: DevTools manifest صحيح + icons تظهر
- [ ] PWA Install: Chrome mobile prompt يظهر + install يعمل
- [ ] PWA Offline: صفحة cached تعمل بدون اتصال
- [ ] Backup Download: ZIP يحتوي data.json + metadata + summary
- [ ] Backup Sanitization: لا passwordHash داخل JSON
- [ ] Skeletons: تظهر فوراً عند التنقل
- [ ] Toast Polish: success 3s / error 5s / warn 10s
- [ ] Full E2E Flow: السيناريو كامل ينجح من البداية للنهاية

---

### ✅ انتهى
ابدأ من Step 1، وامشِ على الـ checklist داخل VS Code حتى تصل لمنتج Production-ready.
