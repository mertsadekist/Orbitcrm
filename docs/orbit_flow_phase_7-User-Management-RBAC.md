
# Phase 7: User Management & RBAC (Company Admin Controls)

## Context
بناء لوحة تحكم مدير الشركة - إدارة المستخدمين مع فحص الحصة (maxUsers)، صلاحيات دقيقة قابلة للتبديل، وعرض سجل التغييرات. يسمح لـ OWNER بإدارة فريقه بالكامل دون تدخل Super Admin.

**ملاحظة:** لا حاجة لتعديل schema - نموذج User و AuditLog موجودان من Phase 1.

**تغيير schema واحد:** إضافة حقل `permissions` (Json) لنموذج User لتخزين الصلاحيات الدقيقة.

---

## Step 1: Schema Update

### إضافة لنموذج User في `prisma/schema.prisma`:
```prisma
permissions  Json?    @default("{}")   // صلاحيات دقيقة (JSON object)
```

### بنية JSON للصلاحيات:
```typescript
interface UserPermissions {
  canExportData: boolean;      // تصدير CSV
  canDeleteLeads: boolean;     // حذف عملاء محتملين
  canDeleteDeals: boolean;     // حذف صفقات
  canViewAnalytics: boolean;   // الوصول لصفحة التحليلات
  canManageQuizzes: boolean;   // إنشاء/تعديل استبيانات
  canBulkActions: boolean;     // عمليات جماعية
}
```

> **القاعدة:** OWNER و MANAGER لديهم كل الصلاحيات افتراضياً (يتجاوزون permissions JSON). الصلاحيات الدقيقة تُطبّق فقط على EMPLOYEE.

---

## Step 2: TypeScript Types (`src/types/user-management.ts`)

```typescript
interface SerializedUser {
  id, companyId, username, email, firstName, lastName,
  avatar?, phone?, role: Role, isActive: boolean,
  permissions: UserPermissions, lastLoginAt?: string,
  createdAt, updatedAt: string
  _count?: { leads: number; deals: number }  // إحصائيات سريعة
}

interface CreateUserData {
  username, email, password, firstName, lastName,
  phone?, role: "MANAGER" | "EMPLOYEE",  // OWNER لا يُنشئ OWNER آخر
  permissions?: Partial<UserPermissions>
}

interface UpdateUserData {
  firstName?, lastName?, email?, phone?,
  role?: "MANAGER" | "EMPLOYEE",
  isActive?: boolean,
  permissions?: UserPermissions
}

// سجل التغييرات
interface SerializedAuditLog {
  id, action, entity, entityId, createdAt: string,
  oldValues?, newValues?: Record<string, unknown>,
  ipAddress?, userAgent?,
  user?: { firstName, lastName, avatar? }
}
```

---

## Step 3: Permission Utilities (`src/lib/auth/permissions.ts`)

```typescript
const DEFAULT_PERMISSIONS: UserPermissions = {
  canExportData: false,
  canDeleteLeads: false,
  canDeleteDeals: false,
  canViewAnalytics: false,
  canManageQuizzes: false,
  canBulkActions: false,
};

// جلب الصلاحيات الفعلية (يأخذ Role في الاعتبار)
function getEffectivePermissions(role: Role, permissions?: UserPermissions): UserPermissions {
  // SUPER_ADMIN, OWNER, MANAGER → كل شيء true
  if (["SUPER_ADMIN", "OWNER", "MANAGER"].includes(role)) {
    return ALL_PERMISSIONS_GRANTED;
  }
  // EMPLOYEE → يستخدم permissions JSON (أو defaults)
  return { ...DEFAULT_PERMISSIONS, ...permissions };
}

// فحص صلاحية محددة
function hasPermission(role: Role, permissions: UserPermissions | null, permission: keyof UserPermissions): boolean;

// قائمة الصلاحيات مع labels
const PERMISSION_DEFINITIONS: Array<{
  key: keyof UserPermissions;
  label: string;
  description: string;
  icon: string;  // lucide icon name
}>;
```

---

## Step 4: Validation Schemas (`src/lib/validators/user-schema.ts`)

| Schema | الوصف |
|--------|-------|
| `createUserSchema` | username (3-50, alphanumeric + dots), email, password (8-128, complexity), firstName, lastName, role, phone?, permissions? |
| `updateUserSchema` | كل الحقول اختيارية عدا id |
| `changePasswordSchema` | currentPassword, newPassword (مع تأكيد) |

**Password complexity:** حرف كبير + حرف صغير + رقم + حرف خاص + 8 أحرف minimum

---

## Step 5: Server Actions (`src/actions/users/`)

### `get-users.ts` - جلب مستخدمي الشركة
```
المتطلبات: MANAGER+
التدفق:
1. getTenant() + التحقق من الصلاحية
2. prisma.user.findMany({
     where: { companyId },
     include: { _count: { select: { leads: true, deals: true } } },
     orderBy: { createdAt: "desc" }
   })
3. إرجاع SerializedUser[]
```

### `create-user.ts` - إنشاء مستخدم جديد
```
المتطلبات: OWNER+
التدفق:
1. getTenant() + Zod validation
2. فحص الحصة: count(users where companyId AND isActive) < company.maxUsers
   → إذا تجاوزت → خطأ "User quota exceeded ({current}/{max})"
3. التحقق: username و email فريدان ضمن الشركة
4. التحقق: لا يمكن إنشاء OWNER أو SUPER_ADMIN
5. bcrypt.hash(password, 12)
6. prisma.$transaction:
   a. إنشاء User مع permissions JSON
   b. إنشاء AuditLog (CREATE User)
7. إرجاع { success, userId }
```

### `update-user.ts` - تعديل مستخدم
```
المتطلبات: OWNER+ (أو المستخدم نفسه لبيانات محدودة)
التدفق:
1. التحقق: المستخدم المستهدف ينتمي لنفس الشركة
2. التحقق: لا يمكن ترقية لـ OWNER أو SUPER_ADMIN
3. التحقق: لا يمكن لـ OWNER تعطيل نفسه
4. prisma.$transaction: تحديث + AuditLog (مع oldValues/newValues)
```

### `toggle-user-status.ts` - تفعيل/تعطيل مستخدم
```
المتطلبات: OWNER+
التدفق:
1. التحقق: لا يمكن تعطيل نفسك
2. التحقق: عند إعادة التفعيل → فحص الحصة مجدداً
3. تحديث isActive + AuditLog
```

### `update-permissions.ts` - تعديل صلاحيات مستخدم
```
المتطلبات: OWNER+ (MANAGER يمكنه تعديل EMPLOYEE فقط)
التدفق:
1. التحقق: المستخدم المستهدف EMPLOYEE (MANAGER+ لا يحتاجون permissions)
2. تحديث permissions JSON + AuditLog
```

### `reset-password.ts` - إعادة تعيين كلمة مرور (بواسطة Admin)
```
المتطلبات: OWNER+
التدفق:
1. bcrypt.hash(newPassword, 12)
2. تحديث passwordHash + AuditLog
```

### `get-audit-logs.ts` - جلب سجل التغييرات
```
المتطلبات: OWNER+
التدفق:
1. prisma.auditLog.findMany({
     where: { companyId },
     include: { user: { select: { firstName, lastName, avatar } } },
     orderBy: { createdAt: "desc" },
     take: 100, skip: (page - 1) * 100
   })
2. إرجاع { logs: SerializedAuditLog[], total, page, totalPages }
```

---

## Step 6: Settings Layout

### `src/app/(dashboard)/settings/layout.tsx`
- تخطيط مع sidebar tabs عمودي (desktop) / أفقي (mobile)
- التبويبات: Users | Audit Log | Company (مستقبلي)

---

## Step 7: User Management UI

### `src/app/(dashboard)/settings/users/page.tsx` (Server Component)
- `getTenant()` + `hasMinimumRole(MANAGER)` → redirect إذا غير مصرح
- جلب users + company (للحصة)
- يمرر البيانات للمكونات

### `src/components/settings/users-table.tsx` (Client)
- جدول Shadcn Table مع:

```
┌─────┬──────────────┬───────────┬──────────┬────────┬─────────┬──────────┬─────────┐
│     │ المستخدم      │ البريد     │ الدور     │ الحالة  │ Leads   │ آخر دخول │ إجراءات │
├─────┼──────────────┼───────────┼──────────┼────────┼─────────┼──────────┼─────────┤
│ [A] │ John Owner   │ john@...  │ OWNER    │ 🟢 نشط │ 45      │ 2h ago   │ ⚙️      │
│ [A] │ Sarah Manager│ sarah@... │ MANAGER  │ 🟢 نشط │ 32      │ 1d ago   │ ⚙️      │
│ [A] │ Mike Sales   │ mike@...  │ EMPLOYEE │ 🟢 نشط │ 18      │ 3h ago   │ ⚙️      │
│ [A] │ Old Employee │ old@...   │ EMPLOYEE │ 🔴 معطل│ 5       │ 30d ago  │ ⚙️      │
└─────┴──────────────┴───────────┴──────────┴────────┴─────────┴──────────┴─────────┘
Showing 4 of 5 users (maxUsers: 10)
```

### `src/components/settings/user-quota-bar.tsx`
- شريط تقدم يوضح الاستخدام: `{active}/{maxUsers} users`
- ألوان: أخضر (<70%)، أصفر (70-90%)، أحمر (>90%)

### `src/components/settings/create-user-dialog.tsx` (Client)
- Dialog مع react-hook-form + zod
- حقول: username, email, password (مع مولد عشوائي)، firstName, lastName, phone, role
- فحص الحصة قبل الإرسال (disabled إذا ممتلئ)
- Password strength indicator

### `src/components/settings/edit-user-sheet.tsx` (Client)
- Sheet منزلق مع تبويبات:

| التبويب | المحتوى |
|---------|---------|
| **Profile** | تعديل firstName, lastName, email, phone |
| **Role & Status** | تغيير الدور (OWNER+ فقط) + Toggle isActive |
| **Permissions** | شبكة switches للصلاحيات الدقيقة (EMPLOYEE فقط) |
| **Security** | زر Reset Password (OWNER+) |

### `src/components/settings/permissions-grid.tsx` (Client)
```
┌─ Permissions ────────────────────────────────────────┐
│                                                       │
│  📥 Can Export Data                          [━━━○]   │
│  Export leads and analytics data as CSV               │
│                                                       │
│  🗑️ Can Delete Leads                        [━━━○]   │
│  Permanently delete lead records                      │
│                                                       │
│  🗑️ Can Delete Deals                        [━━━○]   │
│  Permanently delete deal records                      │
│                                                       │
│  📊 Can View Analytics                      [━━━●]   │
│  Access the analytics dashboard                       │
│                                                       │
│  📝 Can Manage Quizzes                      [━━━○]   │
│  Create, edit, and publish quizzes                    │
│                                                       │
│  ⚡ Can Bulk Actions                        [━━━○]   │
│  Perform bulk assign and status changes               │
│                                                       │
└───────────────────────────────────────────────────────┘
```

- كل صلاحية: أيقونة + عنوان + وصف + Switch
- للـ MANAGER/OWNER: كل switches مفعلة + disabled مع tooltip "Managers always have full permissions"
- التغييرات تُحفظ فوراً (auto-save مع debounce)

---

## Step 8: Audit Log UI

### `src/app/(dashboard)/settings/audit-log/page.tsx` (Server Component)
- `getTenant()` + `hasMinimumRole(OWNER)`
- جلب audit logs مع pagination من searchParams

### `src/components/settings/audit-log-table.tsx` (Client)
```
┌──────────────┬──────────────┬────────────┬───────────────────┬──────────┐
│ الوقت         │ المستخدم      │ الإجراء     │ التفاصيل           │ الكيان    │
├──────────────┼──────────────┼────────────┼───────────────────┼──────────┤
│ 2h ago       │ John Owner   │ CREATE     │ Created new lead   │ Lead     │
│ 5h ago       │ Sarah Manager│ UPDATE     │ Status: NEW→QUAL   │ Lead     │
│ 1d ago       │ Mike Sales   │ LOGIN      │ Successful login   │ User     │
│ 2d ago       │ John Owner   │ DELETE     │ Deleted quiz       │ Quiz     │
└──────────────┴──────────────┴────────────┴───────────────────┴──────────┘
                              [← Previous]  Page 1 of 5  [Next →]
```

### `src/components/settings/audit-log-filters.tsx`
- فلاتر: المستخدم (select)، الإجراء (CREATE/UPDATE/DELETE/LOGIN)، الكيان (Lead/Deal/User/Quiz)، التاريخ
- nuqs للـ URL state

### `src/components/settings/audit-log-detail-modal.tsx`
- Dialog يعرض تفاصيل التغيير عند الضغط على صف:
  - Old Values vs New Values (diff view)
  - IP Address + User Agent
  - Timestamp كامل

---

## Step 9: Permission Guards Integration

### تعديل الملفات الموجودة لفحص الصلاحيات:

| الملف | التعديل |
|-------|---------|
| `src/actions/analytics/export-csv.ts` | فحص `canExportData` |
| `src/actions/leads/bulk-assign-leads.ts` | فحص `canBulkActions` |
| `src/actions/leads/bulk-update-status.ts` | فحص `canBulkActions` |
| `src/components/analytics/export-button.tsx` | إخفاء إذا لا صلاحية |
| `src/components/leads/bulk-actions-bar.tsx` | إخفاء إذا لا صلاحية |
| `src/app/(dashboard)/analytics/page.tsx` | redirect إذا `!canViewAnalytics` |
| `sidebar.tsx` | إخفاء Analytics link إذا `!canViewAnalytics` |

### تعديل `getTenant()` (`src/lib/auth/get-tenant.ts`):
- إضافة `permissions: UserPermissions` لـ TenantContext
- جلب permissions من الجلسة أو من DB عند الحاجة

### تعديل JWT/Session callbacks (`auth.ts`):
- إضافة `permissions` لـ token و session

---

## Step 10: تعديل Sidebar

### تعديل `sidebar.tsx`:
- إضافة "Settings" nav item (أيقونة: `Settings` من lucide-react)
- يظهر لـ MANAGER+ فقط (EMPLOYEE لا يحتاج settings)

---

## هيكل الملفات الجديدة (المرحلة 7)

```
src/
├── types/user-management.ts                     # User + AuditLog types
├── lib/
│   ├── auth/permissions.ts                      # Permission utilities
│   └── validators/user-schema.ts                # Zod schemas
├── actions/users/
│   ├── get-users.ts                             # List company users
│   ├── create-user.ts                           # Create + quota check
│   ├── update-user.ts                           # Edit profile/role
│   ├── toggle-user-status.ts                    # Activate/deactivate
│   ├── update-permissions.ts                    # Toggle permissions
│   ├── reset-password.ts                        # Admin password reset
│   └── get-audit-logs.ts                        # Paginated audit logs
├── components/settings/
│   ├── users-table.tsx                          # Users data table
│   ├── user-quota-bar.tsx                       # Usage progress bar
│   ├── create-user-dialog.tsx                   # Create user form
│   ├── edit-user-sheet.tsx                      # Edit user (4 tabs)
│   ├── permissions-grid.tsx                     # Permission switches
│   ├── audit-log-table.tsx                      # Audit log table
│   ├── audit-log-filters.tsx                    # Audit log filters
│   ├── audit-log-detail-modal.tsx               # Change diff view
│   └── settings-nav.tsx                         # Settings sidebar tabs
└── app/(dashboard)/settings/
    ├── layout.tsx                                # Settings layout with tabs
    ├── users/page.tsx                            # User management page
    └── audit-log/page.tsx                        # Audit log page
```

**إجمالي الملفات الجديدة: ~17 | المعدّلة: ~10** (schema, auth.ts, getTenant, sidebar, + permission guards)

---

## قرارات معمارية

| القرار | الاختيار | السبب |
|--------|---------|-------|
| Permission storage | **JSON field في User** | مرن + لا يحتاج جدول منفصل + قابل للتوسع |
| Permission override | **Role-based override** (MANAGER+ = all) | تبسيط + الصلاحيات الدقيقة للـ EMPLOYEE فقط |
| Quota enforcement | **Server-side فقط** (count active users) | لا يمكن التحايل من Client |
| Password reset | **Admin يُعيد التعيين مباشرة** (بدون email) | MVP - بدون email service بعد |
| Audit log pagination | **100 entries/page** | توازن بين الأداء وسهولة التصفح |
| Permission changes | **Auto-save مع debounce** | UX أسرع بدون زر حفظ |
| Deactivated users | **Soft delete (isActive: false)** | الحفاظ على البيانات والعلاقات |

---

## Verification (التحقق)

1. **User List:** MANAGER يرى جدول المستخدمين مع إحصائيات (leads count, last login)
2. **Quota Check:** محاولة إنشاء مستخدم عندما الحصة ممتلئة → خطأ واضح + الزر معطل
3. **Create User:** OWNER ينشئ EMPLOYEE جديد → يظهر في الجدول + يمكنه تسجيل الدخول
4. **Role Restriction:** محاولة إنشاء OWNER → مرفوض (select لا يعرض OWNER)
5. **Permissions:** تفعيل "Can Export Data" لـ EMPLOYEE → يرى زر Export في Analytics
6. **Permission Guard:** EMPLOYEE بدون "Can View Analytics" → لا يرى رابط Analytics في Sidebar
7. **Deactivate:** OWNER يعطل EMPLOYEE → لا يمكنه تسجيل الدخول + badge يتحول لأحمر
8. **Reactivate + Quota:** إعادة تفعيل مستخدم عندما الحصة ممتلئة → مرفوض
9. **Self-protection:** OWNER يحاول تعطيل نفسه → مرفوض
10. **Reset Password:** OWNER يعيد تعيين كلمة مرور EMPLOYEE → EMPLOYEE يسجل بالكلمة الجديدة
11. **Audit Log:** كل العمليات أعلاه تظهر في سجل التغييرات مع التفاصيل
12. **Audit Detail:** الضغط على صف → عرض old/new values diff
13. **Pagination:** أكثر من 100 entry → التنقل بين الصفحات يعمل
14. **Tenant isolation:** مستخدمو شركة أخرى غير مرئيين