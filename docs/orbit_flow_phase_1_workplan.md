# OrbitFlow SaaS CRM — Phase 1: Foundation & Database Setup

> **Purpose**: This document is an executable technical work plan designed to be opened and followed directly inside **Visual Studio Code**. It acts as a single source of truth for Phase 1 implementation.

---

## 0. Context & Architectural Decisions

- **Product**: OrbitFlow — Multi-tenant SaaS CRM & Lead Generation Platform
- **Framework**: Next.js 15 (App Router, TypeScript)
- **UI**: Shadcn/UI (New York style)
- **Theming**: next-themes (Dark / Light)
- **ORM**: Prisma
- **Database**: MySQL
- **Auth Roles**: SUPER_ADMIN, OWNER, MANAGER, EMPLOYEE
- **Multi-Tenancy Root**: Company
- **Super Admin Company**: `subscriptionId = "PLATFORM"`

---

## 1. Initialize Next.js Project

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Cleanup (Mandatory)

- `src/app/page.tsx` → simple placeholder
- `src/app/globals.css` → keep Tailwind directives only
- `src/app/layout.tsx` → update metadata
- Remove from `/public`:
  - `next.svg`
  - `vercel.svg`

---

## 2. Install Shadcn/UI + Theme Support

```bash
npx shadcn@latest init
# Style: New York
# Base color: Slate
# CSS Variables: Yes
```

```bash
npx shadcn@latest add \
  button card input label separator badge dropdown-menu \
  avatar sheet dialog form select textarea checkbox switch \
  table toast sonner
```

```bash
npm install next-themes
```

### Required Files

- `src/components/providers/theme-provider.tsx`
- `src/components/theme-toggle.tsx`

### Layout Update

- Wrap `<html>` content with `ThemeProvider`
- Enable `suppressHydrationWarning`

---

## 3. Install Prisma & Core Dependencies

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init --datasource-provider mysql
```

```bash
npm install @tanstack/react-query zustand recharts bcryptjs
npm install --save-dev @types/bcryptjs tsx
```

### Environment Files

- `.env`
- `.env.example`

```env
DATABASE_URL="mysql://mysql:ETcEcSR8YFDKnRO5lCc81fWcXzdQxEkC9g0uo8t5MbqeeQ1JcEwsGpAUqIcfzgA7@147.93.27.94:27088/default"
```

### Prisma Singleton

- `src/lib/prisma.ts`
- Prevents multiple DB connections during hot reload

---

## 4. Database Schema (prisma/schema.prisma)

### Enums

- `Role`: SUPER_ADMIN | OWNER | MANAGER | EMPLOYEE
- `PlanType`: FREE | STARTER | PROFESSIONAL | ENTERPRISE
- `LeadStatus`: NEW | CONTACTED | QUALIFIED | UNQUALIFIED | CONVERTED
- `DealStage`: PROSPECTING | QUALIFICATION | PROPOSAL | NEGOTIATION | CLOSED_WON | CLOSED_LOST
- `CommissionStatus`: PENDING | APPROVED | PAID
- `NotificationType`: INFO | SUCCESS | WARNING | ERROR | LEAD_ASSIGNED | DEAL_UPDATE | COMMISSION_UPDATE

---

## 5. Models Overview (8 Models)

### 1. Company (Multi-Tenancy Root)

- `subscriptionId` (unique)
- `plan`, `maxUsers`, `isActive`
- **Cascade delete** on all relations

> ⚠️ `subscriptionId = PLATFORM` is reserved for Super Admin

---

### 2. User

- Unique per company: `(companyId, username)` & `(companyId, email)`
- Password stored as bcrypt hash
- Indexed by `companyId`, `role`

---

### 3. Quiz

- Dynamic JSON config
- Unique slug per company

```json
{
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "question": "...",
      "options": [],
      "required": true,
      "weight": 10
    }
  ],
  "settings": {
    "showProgressBar": true,
    "thankYouMessage": "",
    "redirectUrl": null
  }
}
```

---

### 4. Lead

- Linked to Quiz & assigned User (optional)
- Indexed by company, status, assignee

---

### 5. Deal (Kanban)

- Decimal(12,2) values
- Probability (0–100)

---

### 6. Commission

- Linked to Deal & User
- Status lifecycle: PENDING → APPROVED → PAID

---

### 7. AuditLog (Immutable)

- No `updatedAt`
- Tracks CREATE / UPDATE / DELETE / LOGIN

---

### 8. Notification

- User-scoped
- Read / unread support

---

## 6. Push Schema to Database

```bash
npx prisma db push
npx prisma generate
```

> ℹ️ Migrations (`prisma migrate dev`) start from Phase 2

---

## 7. Seed Script (prisma/seed.ts)

### package.json

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Seeded Data

- **Platform Company** (`PLATFORM`)
- **Super Admin**: `superadmin / SuperAdmin@123`
- **Demo Company**: Acme Corporation (PROFESSIONAL)
- Users:
  - Owner
  - Manager
  - 2 Employees
- Quiz: Business Needs Assessment
- Leads: 5 (varied statuses)
- Deals: 3 ($75K / $150K / $250K)
- Commissions: 2
- Audit Logs: 3
- Notifications: 3

```bash
npx prisma db seed
```

---

## 8. Final Project Structure

```text
Saas-CRM-V0.1/
├── .env
├── .env.example
├── components.json
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── providers/theme-provider.tsx
    │   ├── theme-toggle.tsx
    │   └── ui/
    └── lib/
        ├── prisma.ts
        └── utils.ts
```

---

## 9. Verification Checklist

- [ ] `npx prisma db push` (no errors)
- [ ] `npx prisma studio` opens DB
- [ ] `npx prisma db seed` completes successfully
- [ ] `npm run dev` → `localhost:3000`
- [ ] Dark / Light toggle works
- [ ] Platform + Demo data visible in Prisma Studio

---

✅ **Phase 1 is complete when all checklist items pass.**

