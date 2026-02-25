# OrbitFlow SaaS CRM — Phase 2: Authentication & Multi‑Tenancy Logic

> **الهدف**: تأمين التطبيق بنظام مصادقة ثلاثي الحقول **(Subscription ID + Username + Password)** باستخدام **NextAuth v5 (beta)**، وضمان أن **كل استعلام/طلب بيانات محصور بـ `companyId`** القادم من الجلسة.

> **مبدأ ذهبي**: لا يوجد دخول أو استعلام بيانات بدون **Company (Tenant) صالح**.

---

## 0) قرارات معمارية (Split Auth Pattern)

- فصل الإعدادات إلى ملفين:
  - **`auth.config.ts`**: إعدادات خفيفة **Edge/Middleware safe** (بدون Prisma / bcrypt)
  - **`auth.ts`**: إعدادات كاملة (Prisma + Credentials Provider + callbacks)
- إستراتيجية الجلسة: **JWT**
- مدة الجلسة: **8 ساعات**
- حماية المسارات عبر **middleware** الذي يستورد فقط `auth.config.ts`

---

## 1) Install NextAuth v5

```bash
npm install next-auth@beta
```

> ملاحظة: `bcryptjs` و `zod` موجودين من Phase 1.

---

## 2) Environment Variables

أضف إلى `.env`:

```env
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
```

توليد Secret (مثال):

```bash
openssl rand -base64 32
```

---

## 3) TypeScript Type Extensions

### File
- `src/types/next-auth.d.ts`

### المطلوب
توسيع أنواع NextAuth لتضمين الحقول المخصصة:

- `User`:
  - `id, companyId, role, subscriptionId, username, firstName, lastName`
- `Session.user`:
  - نفس الحقول أعلاه + `DefaultSession["user"]`
- `JWT`:
  - نفس الحقول أعلاه

> `role` يجب أن يكون union literal:
> `"SUPER_ADMIN" | "OWNER" | "MANAGER" | "EMPLOYEE"`

---

## 4) Auth Configuration (Split)

### 4a) `auth.config.ts` (Root — Edge Safe)

**يحتوي فقط على:**
- `pages.signIn = "/login"`
- `session.strategy = "jwt"` و `maxAge = 8h`
- `callbacks.authorized` لمنطق حماية المسارات

#### Rules (authorized callback)

| المسار | القاعدة |
|---|---|
| `/login`, `/quiz/*`, `/api/public/*`, `/api/auth/*` | عام (مسموح دائماً) |
| `/login` + مسجل دخول | إعادة توجيه → `/dashboard` |
| `/super-admin/*` | يتطلب `role === "SUPER_ADMIN"` |
| بقية المسارات | تتطلب مصادقة |

---

### 4b) `auth.ts` (Root — Full)

- يستورد `authConfig`
- يضيف **Credentials Provider** بثلاث حقول
- يعرّف callbacks:
  - `jwt`: ينقل بيانات `User` → `token` عند أول تسجيل دخول
  - `session`: ينقل `token` → `session.user` في كل طلب

---

## 5) Credentials Provider Logic (داخل `auth.ts`)

### التدفق خطوة بخطوة

1) **Zod validation** → `INVALID_INPUT` إذا فشل
2) `prisma.company.findUnique({ where: { subscriptionId } })`
   - إذا لا يوجد → `COMPANY_NOT_FOUND`
   - إذا غير نشط → `COMPANY_INACTIVE`
3) `prisma.user.findUnique({ where: { companyId_username } })`
   - إذا لا يوجد → `INVALID_CREDENTIALS` *(رسالة عامة لمنع تعداد المستخدمين)*
4) `bcrypt.compare(password, user.passwordHash)`
   - إذا فشل → `INVALID_CREDENTIALS`
5) **Transaction**:
   - تحديث `lastLoginAt`
   - إنشاء `AuditLog` (action: `LOGIN`)
6) return user object → يمر إلى `jwt callback`

### اعتبارات أمان

- رسالة `INVALID_CREDENTIALS` موحدة لعدم وجود المستخدم/خطأ كلمة المرور
- `select` محدود (لا نجلب بيانات غير ضرورية)
- Transaction لضمان تناسق البيانات

---

## 6) JWT & Session Callbacks

سير البيانات:

```text
authorize() → returns User
    ↓
jwt({ token, user })  // user available only at first sign-in
    token.companyId = user.companyId
    token.role = user.role
    ...
    ↓  (encrypted as HTTP-only cookie)
session({ session, token })
    session.user.companyId = token.companyId
    session.user.role = token.role
    ...
```

---

## 7) Route Handler

### File
- `src/app/api/auth/[...nextauth]/route.ts`

### المطلوب

```ts
export { GET, POST } from "../../../../../auth";
```

> المسار نسبي لأن `auth.ts` في الجذر. (بديل لاحقاً: alias في tsconfig)

---

## 8) Middleware

### File
- `middleware.ts` (Root)

### قواعد مهمة
- يستورد فقط: `auth.config.ts` (بدون Prisma)
- يُطبق الحماية على المسارات عبر matcher

### Matcher
- كل المسارات **عدا** الملفات الثابتة:
  - `_next/static`
  - `_next/image`
  - `favicon.ico`
  - الصور/الملفات العامة

> الهدف: تنفيذ `authorized callback` على كل طلب مطابق.

---

## 9) getTenant() Utility

### File
- `src/lib/auth/get-tenant.ts`

### وظائف

| الوظيفة | الاستخدام | السلوك عند عدم المصادقة |
|---|---|---|
| `getTenant()` | Server Components / Server Actions | `redirect("/login")` |
| `getTenantOrNull()` | API Route Handlers | `return null` ثم API يعيد 401 |
| `hasMinimumRole(current, required)` | فحص الصلاحيات | ترتيب: SUPER_ADMIN(4) > OWNER(3) > MANAGER(2) > EMPLOYEE(1) |

### TenantContext

```ts
interface TenantContext {
  userId: string;
  companyId: string;
  role: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "EMPLOYEE";
  subscriptionId: string;
  username: string;
  firstName: string;
  lastName: string;
}
```

### القاعدة الذهبية

> كل استعلام قاعدة بيانات يبدأ بـ:

```ts
const tenant = await getTenant();
```

ثم:

```ts
where: { companyId: tenant.companyId }
```

---

## 10) Validation & Error Handling

### 10a) Login Schema

File: `src/lib/auth/login-schema.ts`

- `subscriptionId` (1–50)
- `username` (1–50)
- `password` (1–128)

### 10b) Auth Errors Map

File: `src/lib/auth/auth-errors.ts`

| الكود | الرسالة |
|---|---|
| INVALID_INPUT | Please fill in all fields correctly |
| COMPANY_NOT_FOUND | No organization found with this Subscription ID |
| COMPANY_INACTIVE | This organization's account has been deactivated |
| INVALID_CREDENTIALS | Invalid username or password |
| USER_INACTIVE | Your account has been deactivated |

---

## 11) Login UI

### 11a) Auth Layout

File: `src/app/(auth)/layout.tsx`
- تخطيط مركزي
- خلفية gradient
- يدعم Dark/Light

### 11b) Login Page

File: `src/app/(auth)/login/page.tsx`
- Server Component
- يجمع Logo + LoginForm
- Metadata: `"Sign In | OrbitFlow"`

### 11c) Login Form

File: `src/components/auth/login-form.tsx`
- Client Component
- 3 Inputs بأيقونات (lucide-react): `Building2`, `User`, `Lock`
- Zod validation على العميل
- `signIn("credentials", { redirect: false })`
- Loading state مع `useTransition`
- عرض أخطاء محددة (Alert)
- Success → `router.push("/dashboard")` ثم `router.refresh()`

### 11d) OrbitFlow Logo

File: `src/components/auth/orbitflow-logo.tsx`
- شعار نصي + orbit icon بسيط بـ CSS gradient

### 11e) Dashboard Placeholder

File: `src/app/(dashboard)/dashboard/page.tsx`
- يعرض بيانات session للتأكد من عمل المصادقة

---

## 12) File Changes Summary (Phase 2)

```text
Saas-CRM-V0.1/
├── auth.config.ts
├── auth.ts
├── middleware.ts
└── src/
    ├── types/
    │   └── next-auth.d.ts
    ├── lib/auth/
    │   ├── get-tenant.ts
    │   ├── login-schema.ts
    │   └── auth-errors.ts
    ├── app/
    │   ├── api/auth/[...nextauth]/route.ts
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   └── login/page.tsx
    │   └── (dashboard)/
    │       └── dashboard/page.tsx
    └── components/auth/
        ├── login-form.tsx
        └── orbitflow-logo.tsx
```

- **ملفات جديدة**: 13
- **ملفات معدّلة**: 1–2 (غالباً `package.json` و ربما `tsconfig.json`)

---

## 13) Usage Patterns (للمراحل القادمة)

### Server Component

```ts
const tenant = await getTenant();
const leads = await prisma.lead.findMany({
  where: { companyId: tenant.companyId },
});
```

### Server Action

```ts
const tenant = await getTenant();
if (!hasMinimumRole(tenant.role, "MANAGER")) {
  throw new Error("Insufficient permissions");
}

await prisma.lead.create({
  data: { companyId: tenant.companyId, /* ... */ },
});
```

### API Route

```ts
const tenant = await getTenantOrNull();
if (!tenant) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Super Admin (بدون companyId filter)

```ts
const tenant = await getTenant();
if (tenant.role !== "SUPER_ADMIN") redirect("/dashboard");

const companies = await prisma.company.findMany();
```

---

## 14) Verification Checklist

- [ ] `npm run dev` يعمل بدون أخطاء
- [ ] زيارة `/dashboard` بدون تسجيل دخول → redirect إلى `/login`
- [ ] تسجيل دخول: `DEMO-2024-001 / john.owner / Password@123` → `/dashboard`
- [ ] تسجيل دخول: `PLATFORM / superadmin / SuperAdmin@123` → `/super-admin`
- [ ] بيانات خاطئة → رسائل واضحة ومحددة
- [ ] زيارة `/super-admin` بمستخدم عادي → redirect إلى `/dashboard`
- [ ] زيارة `/quiz/test` بدون تسجيل دخول → مسموح (Public)
- [ ] Dark/Light mode يعمل في صفحة Login

---

✅ **Phase 2 مكتملة عندما ينجح كل ما في Verification Checklist.**

