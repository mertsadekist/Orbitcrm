# OrbitFlow CRM

**Multi-Tenant SaaS CRM & Lead Generation Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.3.0-2D3748)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

OrbitFlow is a production-ready, enterprise-grade CRM platform built for SaaS businesses. It combines powerful lead generation tools, pipeline management, commission tracking, and advanced analytics in a single, multi-tenant platform.

---

## 📸 Screenshots

> **TODO:** Add screenshots of key features:
> - Dashboard overview
> - Lead Kanban board
> - Quiz builder interface
> - Analytics charts
> - Deal pipeline

---

## ✨ Features

### 🎯 Core Modules

#### 1. Authentication & Role-Based Access Control (RBAC)
- **4-Tier Role Hierarchy:** SUPER_ADMIN > OWNER > MANAGER > EMPLOYEE
- JWT-based sessions with NextAuth v5
- Multi-tenant isolation with company-level data separation
- Granular permission system (view analytics, export data, bulk actions, user management)
- Session impersonation for super admins (read-only mode with audit trail)
- Secure credential-based authentication with bcrypt password hashing
- Last login tracking and session management

#### 2. Quiz Builder & Lead Generation Engine
- **7 Question Types:** Text, Multiple choice, Image grid, Email, Phone, Name, Contact form
- Public quiz URLs with custom company branding: `/q/[company]/[quiz-slug]`
- Real-time lead capture with automatic scoring (0-100+ scale)
- Question configuration:
  - Required/optional fields
  - Custom placeholders and descriptions
  - Question weights (1-10) for scoring
  - Vertical/horizontal/card layouts for multiple choice
  - Image grid support (2-4 columns)
- Quiz settings:
  - Progress bar toggle
  - Custom thank you messages
  - Redirect URLs after completion
  - Primary color branding
  - Background image support
  - Welcome screen customization
- Facebook Pixel & TikTok Pixel integration for conversion tracking
- Lead data enrichment from quiz responses
- Draft/Published status with validation

#### 3. Lead Management (CRM)
- **Kanban Board** with 5 statuses: NEW → CONTACTED → QUALIFIED → UNQUALIFIED → CONVERTED
- Drag-and-drop status updates with automatic audit trails
- Lead scoring based on quiz question weights
- Source tracking (quiz, manual, import, etc.)
- WhatsApp click-to-chat integration
- **Notes Timeline:**
  - Add multiple notes per lead
  - User attribution (created by, updated by)
  - Edit/delete capabilities for MANAGER+ roles
  - Timestamp tracking with relative dates
- **Bulk Operations:**
  - Assign multiple leads to team members
  - Update status for multiple leads
  - Export to CSV
- **Advanced Filtering:**
  - By assigned team member
  - By source
  - By score range (min/max)
  - By creation date
  - By conversion status
- Lead detail modal with tabs: Info, Quiz Responses, Timeline, Deals, Notes

#### 4. Deal Pipeline Management
- **6-Stage Pipeline:** Prospecting → Qualification → Proposal → Negotiation → Closed Won/Lost
- Drag-and-drop deal stage management
- Deal value tracking with currency support
- Probability percentage (0-100%)
- Expected close date and actual close date tracking
- Commission splits (multiple users per deal)
- Deal assignment to individual team members
- Deal timeline showing all stage transitions
- Win/loss analysis and reporting
- Deal detail modal with tabs: Info, Commissions, Timeline

#### 5. Commission System
- **3-Status Workflow:** PENDING → APPROVED → PAID
- Percentage-based commission splits with multi-user attribution
- Automatic amount calculation (deal value × percentage)
- **Approval Workflow:**
  - Only OWNER role can approve commissions
  - Bulk approval for multiple pending commissions
  - Approval tracking with timestamps
- **Payment Tracking:**
  - Mark commissions as paid
  - Payment date recording
  - Payment history per user
- Commission visibility in deal details
- Comprehensive audit logging for all commission changes

#### 6. Analytics & Reporting Engine
- **Visual Query Builder** (no SQL knowledge required)
- **20+ Metrics:**
  - Total leads, leads this period
  - Qualified leads count
  - Conversion rate percentage
  - Total deal value, average deal value
  - Pipeline value (deals in progress)
  - Commission distribution by user
  - Source performance metrics
  - Activity trends over time
- **8+ Chart Types:**
  - Line charts (daily activity trends)
  - Bar charts (revenue by period)
  - Pie charts (leads by source)
  - Area charts (growth over time)
  - Funnel analysis (lead status progression with drop-off rates)
  - Comparison charts (period over period)
- **Custom Date Range Filtering:**
  - Last 7/30 days
  - This month/year
  - Custom date ranges
  - Comparison periods
- **CSV Export** with formatted data (requires canExportData permission)
- Real-time calculations and aggregations

#### 7. User Management
- **User CRUD Operations:**
  - Create users with automatic invitation
  - Edit user profiles (name, email, phone)
  - Role assignment (EMPLOYEE, MANAGER, OWNER)
  - Active/Inactive status toggle
- **Quota Visualization:**
  - Active users vs. max users (per company plan)
  - Progress bars for quota tracking
  - Upgrade prompts when nearing limits
- **Activity Tracking:**
  - Last login timestamp
  - Login history
  - User action audit trail
- **Permission System:**
  - Base role permissions (automatic)
  - Custom permission overrides per user (JSON storage)
  - Granular permissions: canViewAnalytics, canExportData, canBulkActions, etc.
- **Password Management:**
  - Secure password reset flow
  - Password strength requirements
  - bcrypt hashing for security
- Username and email uniqueness enforced per company

#### 8. Audit Logging
- **Comprehensive Change Tracking:**
  - All Create/Update/Delete operations logged
  - Entity-level tracking (Lead, Deal, User, Commission, Quiz, etc.)
  - Before/after value comparison (JSON diffs)
- **Audit Log Details:**
  - User who performed the action
  - Timestamp (with timezone support)
  - Action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
  - Entity ID and type
  - IP address capture
  - User agent tracking
- **Filtering & Search:**
  - By user
  - By action type
  - By entity type
  - By date range
- **Pagination:** 50 logs per page
- **OWNER-only access** for compliance and security

#### 9. Super Admin God Mode
- **Company Management:**
  - Create new tenant companies
  - View all companies with stats (users, leads, deals, revenue)
  - Search and filter companies by name, plan, status
  - Update company quotas (maxUsers, maxQuizzes)
  - Edit subscription plan (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
  - Toggle company active status (blocks login for deactivated companies)
  - Add internal notes to company records
- **Company Impersonation:**
  - "Login As" any company (read-only mode)
  - View company dashboard without write access
  - Impersonation guard prevents sensitive operations
  - Audit trail of all impersonation actions
  - Easy return to super admin context
- **Global Statistics Dashboard:**
  - Platform-wide KPIs: Total companies, users, leads, deals, revenue
  - Growth trends (monthly charts for 12 months)
  - Subscription plan distribution
  - Revenue analytics by plan
  - Active company percentage
- **System Logs:**
  - View application errors and system events
  - Filter by log level (INFO, WARNING, ERROR)
  - Filter by source (CLIENT, SERVER_ACTION, API_ROUTE)
  - Date range filtering
  - Real-time pagination (50 logs per page)
  - Stack trace viewing for debugging

#### 10. Data Backup & Export
- **One-Click ZIP Backup:**
  - Exports all company data (leads, deals, users, quizzes, commissions)
  - Sanitized exports (no passwords or secrets)
  - JSON format + metadata + human-readable summary
  - Downloadable ZIP archive
- **OWNER+ Access Only:**
  - Regular users cannot export company data
  - Super admin can backup any company
- **Audit Logging:**
  - All backup operations logged
  - Tracking who exported what and when

#### 11. Progressive Web App (PWA)
- **Installable Application:**
  - Desktop and mobile installation
  - Native app experience
  - Custom app icon and splash screens
- **Offline Support:**
  - Service worker caching
  - Offline page when network unavailable
  - Background sync when connection restored
- **Theme Support:**
  - Light/Dark mode toggle
  - System preference detection
  - Persistent theme preference
  - Smooth theme transitions

#### 12. System Reliability
- **Error Boundaries:**
  - React error boundaries for graceful degradation
  - Fallback UI when components crash
  - Error reporting to SystemLog
- **Error Logging:**
  - Client errors logged via `/api/log-error`
  - Server errors logged to SystemLog with stack traces
  - Error ID tracking for debugging
  - User-friendly error messages
- **Custom Error Pages:**
  - 404 Not Found with navigation
  - 500 Internal Server Error with retry
  - Recovery actions and support links
- **Toast Notifications:**
  - Sonner-based success/error/warning/info toasts
  - Consistent notification patterns
  - Auto-dismiss and manual dismiss options
- **Loading States:**
  - Skeleton screens for all major routes
  - Loading indicators for async operations
  - Optimistic UI updates with React Query

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.0 | Type safety and developer experience |
| **Tailwind CSS** | 4.0 | Utility-first styling |
| **Shadcn/UI** | Latest | Component library (Radix UI primitives) |
| **TanStack Query** | 5.90.20 | Server state management and caching |
| **React Hook Form** | 7.71.1 | Form state management |
| **Zod** | 4.3.6 | Schema validation |
| **dnd-kit** | 6.3.1 | Drag and drop functionality |
| **Recharts** | 3.7.0 | Chart visualizations |
| **next-themes** | 0.4.6 | Dark mode support |
| **Sonner** | 2.0.7 | Toast notifications |
| **Lucide React** | 0.563.0 | Icon system |
| **date-fns** | 4.1.0 | Date utilities |
| **emoji-picker-react** | 4.13.4 | Emoji selection |
| **nuqs** | 2.2.6 | URL search parameter management |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Prisma** | 7.3.0 | ORM and database migrations |
| **MariaDB** | 10.x+ | Primary relational database |
| **NextAuth** | 5.0.0-beta.30 | Authentication and session management |
| **bcryptjs** | 3.0.3 | Password hashing |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization for consistent deployments |
| **Coolify** | Self-hosted PaaS platform (recommended) |
| **Nginx/Caddy** | Reverse proxy (via Coolify) |

### Development

| Technology | Purpose |
|-----------|---------|
| **ESLint** | Code linting and standards |
| **tsx** | TypeScript execution for scripts |
| **dotenv** | Environment variable management |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** 20.x or higher ([Download](https://nodejs.org/))
- **npm:** 10.x or higher (comes with Node.js)
- **MariaDB/MySQL:** 10.5+ or MySQL 8.0+ ([Installation Guide](https://mariadb.org/download/))
- **Git:** For cloning the repository

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/orbitflow-crm.git
cd orbitflow-crm
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MariaDB/MySQL connection string | `mysql://user:pass@localhost:3306/orbitflow` |
| `AUTH_SECRET` | NextAuth encryption key (32+ characters) | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Application base URL | `http://localhost:3000` (dev) / `https://your-domain.com` (prod) |
| `AUTH_TRUST_HOST` | Enable for reverse proxy | `true` |

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### 4. Set Up Database

**Create a database** (if not exists):
```sql
CREATE DATABASE orbitflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Run Prisma migrations:**
```bash
npx prisma migrate deploy
```

**Generate Prisma client:**
```bash
npx prisma generate
```

#### 5. Seed Database (Optional but Recommended)

```bash
npm run seed
```

This creates:
- **Platform company** with super admin account
- **Demo company** (Acme Corporation) with test users
- **Sample data:** Quizzes, leads, deals, and commissions for testing

#### 6. Start Development Server

```bash
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

---

### Default Credentials (After Seeding)

| Role | Username | Email | Password | Subscription ID |
|------|----------|-------|----------|-----------------|
| **Super Admin** | superadmin | admin@orbitflow.io | SuperAdmin@123 | platform |
| **Owner** | john.owner | john@acme.com | Password@123 | acme |
| **Manager** | sarah.manager | sarah@acme.com | Password@123 | acme |
| **Employee** | mike.employee | mike@acme.com | Password@123 | acme |

**⚠️ SECURITY WARNING:** Change these passwords immediately before deploying to production!

---

### Project Structure

```
orbitflow-crm/
├── prisma/
│   ├── schema.prisma              # Database schema (9 models)
│   ├── migrations/                # Migration history
│   └── seed.ts                    # Database seeding script
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # Authentication routes (/login)
│   │   ├── (dashboard)/          # Main dashboard routes
│   │   │   ├── dashboard/        # Dashboard home
│   │   │   ├── leads/            # Lead management Kanban
│   │   │   ├── pipeline/         # Deal pipeline Kanban
│   │   │   ├── quizzes/          # Quiz builder
│   │   │   ├── analytics/        # Analytics & reporting
│   │   │   └── settings/         # Settings (users, audit, backup)
│   │   ├── (super-admin)/        # Super admin routes
│   │   │   └── super-admin/
│   │   │       ├── companies/    # Company management
│   │   │       ├── stats/        # Global statistics
│   │   │       └── logs/         # System logs
│   │   ├── api/                  # API routes
│   │   │   ├── auth/             # NextAuth endpoints
│   │   │   ├── log-error/        # Client error logging
│   │   │   └── backup/           # Backup export
│   │   └── q/                    # Public quiz routes
│   │       └── [companySlug]/[quizSlug]/
│   ├── components/               # React components
│   │   ├── ui/                   # Shadcn base components
│   │   ├── leads/                # Lead management components
│   │   ├── deals/                # Deal pipeline components
│   │   ├── analytics/            # Analytics charts
│   │   ├── quiz/                 # Quiz builder components
│   │   ├── super-admin/          # Super admin components
│   │   └── ...
│   ├── actions/                  # Server actions
│   │   ├── leads/                # Lead CRUD and operations
│   │   ├── deals/                # Deal CRUD and operations
│   │   ├── users/                # User management
│   │   ├── quiz/                 # Quiz builder actions
│   │   ├── analytics/            # Analytics queries
│   │   └── super-admin/          # Super admin operations
│   ├── lib/                      # Utilities and helpers
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── logger.ts             # Error logging and withErrorHandling
│   │   ├── auth/                 # Auth utilities (get-tenant, impersonation-guard)
│   │   └── validators/           # Zod schemas
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-lead-mutation.ts  # Lead mutations (TanStack Query)
│   │   ├── use-deal-mutation.ts  # Deal mutations
│   │   └── ...
│   ├── types/                    # TypeScript type definitions
│   │   ├── lead.ts               # Lead and related types
│   │   ├── deal.ts               # Deal and related types
│   │   └── ...
│   └── generated/                # Prisma generated client
│       └── prisma/client/
├── public/                       # Static assets
│   ├── icons/                    # PWA icons (192x192, 512x512)
│   └── manifest.json             # PWA manifest
├── docs/                         # Documentation
│   ├── orbit_flow_phase_1_workplan.md
│   ├── orbit_flow_phase_2_auth_multi_tenancy.md
│   ├── ... (phases 3-8)
│   └── DEPLOYMENT.md             # Deployment guide
├── Dockerfile                    # Docker configuration (multi-stage)
├── .dockerignore                 # Docker build exclusions
├── nixpacks.toml                 # Nixpacks config (Coolify fallback)
├── next.config.ts                # Next.js configuration
├── prisma.config.ts              # Prisma v7 configuration
├── auth.config.ts                # NextAuth configuration
├── auth.ts                       # NextAuth handlers
├── middleware.ts                 # Request middleware (auth)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment template (development)
└── .env.production.example       # Environment template (production)
```

---

## 🚢 Deployment

### Deploying to Coolify

[Coolify](https://coolify.io/) is an open-source, self-hostable platform-as-a-service (PaaS) alternative to Heroku and Vercel.

#### Prerequisites

1. **Coolify instance running** ([Installation guide](https://coolify.io/docs/installation))
2. **MariaDB database** (can be created in Coolify)
3. **Domain name** with DNS configured (optional but recommended for HTTPS)

#### Step 1: Create Database

1. In Coolify dashboard, navigate to **Databases**
2. Click **Add Database** → **MariaDB**
3. Configure:
   - **Name:** `orbitflow-db`
   - **Database name:** `orbitflow`
   - **Root password:** [generate secure password]
4. Click **Deploy**
5. **Note the connection details** for later use

#### Step 2: Create Application

1. Navigate to **Applications** → **Add Application**
2. Select deployment method:
   - **Option A:** GitHub repository (recommended for auto-deploys)
   - **Option B:** Manual Git URL

**For GitHub:**
- Connect your GitHub account
- Select repository: `yourusername/orbitflow-crm`
- Branch: `main` (or your production branch)

#### Step 3: Configure Build Settings

1. **Build Pack:** Select `Dockerfile` (recommended)
   - Coolify will detect the Dockerfile automatically
   - Alternative: `Nixpacks` (uses nixpacks.toml)
2. **Port:** `3000`
3. **Health Check Path:** `/api/health` (optional, not yet implemented)

#### Step 4: Set Environment Variables

In Coolify, navigate to **Environment Variables** and add:

| Variable | Value | How to Get |
|----------|-------|------------|
| `DATABASE_URL` | `mysql://root:PASSWORD@orbitflow-db:3306/orbitflow` | Use Coolify's **Internal Connection String** |
| `AUTH_SECRET` | [Generate] | Run `openssl rand -base64 32` in terminal |
| `AUTH_URL` | `https://your-domain.com` | Your production domain (with HTTPS) |
| `AUTH_TRUST_HOST` | `true` | Required for Coolify reverse proxy |
| `NODE_ENV` | `production` | Auto-set by Coolify |

**Getting DATABASE_URL from Coolify:**
1. Go to your MariaDB service in Coolify
2. Find **Internal Connection String**
3. Replace `DATABASE` with `orbitflow`
4. Example: `mysql://root:abc123@orbitflow-db:3306/orbitflow`

#### Step 5: Deploy

1. Click **Deploy** button in Coolify
2. Coolify will:
   - Clone your repository
   - Build the Docker image using the Dockerfile
   - Run the container
3. **Monitor the build logs** for any errors

#### Step 6: Run Database Migrations

After the first deployment, you need to run Prisma migrations:

**Option A: Via Coolify Console**
1. Go to your application in Coolify
2. Click **Console** tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

**Option B: Via SSH**
```bash
# SSH into Coolify server
ssh user@your-coolify-server

# Find container ID
docker ps | grep orbitflow

# Execute migration
docker exec -it <container-id> npx prisma migrate deploy
```

**Seed database (optional):**
```bash
docker exec -it <container-id> npm run seed
```

#### Step 7: Configure Domain

1. In Coolify, go to **Domains** section
2. Add your domain: `crm.yourdomain.com`
3. **Enable HTTPS** (Coolify uses Let's Encrypt automatically)
4. **Update `AUTH_URL`** environment variable to match your domain if different

#### Step 8: Verify Deployment

1. Visit `https://your-domain.com`
2. Test login with seeded credentials
3. Check browser console for errors
4. Verify database connections via **Super Admin** → **System Logs**

---

### Environment Variables Reference

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `mysql://user:pass@host:3306/db` |
| `AUTH_SECRET` | Session encryption key (32+ chars) | `openssl rand -base64 32` |
| `AUTH_URL` | Application base URL | `https://crm.example.com` |
| `AUTH_TRUST_HOST` | Trust proxy headers | `true` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Facebook Pixel for quiz tracking | - |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | TikTok Pixel for quiz tracking | - |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `TZ` | Timezone | Server timezone |

---

### Database Migrations

**Development:**
```bash
# Create and apply migration
npx prisma migrate dev --name migration_name
```

**Production:**
```bash
# Apply existing migrations only
npx prisma migrate deploy
```

**View Migration Status:**
```bash
npx prisma migrate status
```

**Reset Database (⚠️ WARNING - Deletes all data):**
```bash
npx prisma migrate reset
```

---

### Troubleshooting Deployment

#### Build fails with "Prisma client not generated"

**Solution:** Ensure `npx prisma generate` runs in Dockerfile before `npm run build`. Check the Dockerfile `builder` stage.

#### "Invalid AUTH_SECRET" error on login

**Solution:**
1. Regenerate with `openssl rand -base64 32`
2. Update in Coolify environment variables
3. Restart the application

#### Database connection timeout

**Solution:**
- Verify `DATABASE_URL` uses Coolify's **internal connection** (e.g., `orbitflow-db:3306`, not external IP)
- Check database container is running in Coolify
- Ensure database and app are in the same Coolify project/network

#### 502 Bad Gateway

**Solution:**
- Check application logs in Coolify for startup errors
- Verify port 3000 is exposed in Dockerfile
- Ensure environment variables are set correctly
- Check if container is running: `docker ps`

#### PWA not installing on mobile

**Solution:**
- Ensure `AUTH_URL` is HTTPS (PWA requires secure context)
- Verify `manifest.json` is accessible at `/manifest.json`
- Check service worker registration in browser DevTools

---

## 💻 Development

### Running Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server (with hot reload)
npm run dev
```

### Building for Production

```bash
# Create production build
npm run build

# Start production server
npm run start
```

### Database Management

```bash
# Open Prisma Studio (visual database editor)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# View migration status
npx prisma migrate status

# Seed database with test data
npm run seed
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Type check without building
npx tsc --noEmit
```

---

## 📡 API Reference

### Public Endpoints

#### Submit Quiz Response

```http
POST /q/[companySlug]/[quizSlug]
Content-Type: application/json

Body: {
  "answers": {
    "questionId": "answer value"
  }
}

Response: {
  "success": true,
  "leadId": "uuid"
}
```

### Protected Endpoints (Require Authentication)

All `/api/*` routes require valid session except:
- `/api/auth/*` (NextAuth endpoints)
- `/api/log-error` (client error logging)

### Server Actions

Located in `src/actions/`, organized by module:

- **leads/**: Lead CRUD, status updates, assignment, bulk operations, notes
- **deals/**: Deal management, stage updates, closing, commissions
- **users/**: User management, permissions, password reset
- **analytics/**: Query builder, chart data, CSV export
- **super-admin/**: Company management, impersonation, global stats, system logs
- **quiz/**: Quiz CRUD, publishing, submission

**All actions return `ActionResult<T>`:**
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode; errorId?: string }
```

---

## 🧠 Key Concepts

### Multi-Tenancy

Every data record is scoped to a `companyId`:
- Users belong to one company (enforced at DB level)
- Leads, deals, quizzes are company-specific
- Super admin can view all companies via impersonation
- Strict data isolation enforced at query level (all queries include `companyId` filter)

### Role Hierarchy

```
SUPER_ADMIN (level 4)
    ↓ All platform access
  OWNER (level 3)
    ↓ Company management, user management, commissions, backups
 MANAGER (level 2)
    ↓ Lead/deal management, analytics, user viewing
 EMPLOYEE (level 1)
    ↓ Basic lead/deal access
```

Higher roles inherit all lower role permissions automatically.

### Permissions System

Each user has:
1. **Base role permissions** (automatic based on role)
2. **Custom permission overrides** (per-user JSON field)

Effective permissions = merge(rolePermissions, userOverrides)

Example permissions:
- `canViewAnalytics`: View analytics page
- `canExportData`: Export CSV files
- `canBulkActions`: Bulk assign/update leads
- `canManageUsers`: Access user management

### Impersonation (Super Admin)

- **Read-only mode:** Super admin can view any company's dashboard
- **No write access:** All mutations blocked via `assertNotImpersonating()` guard
- **Original session preserved:** Session restored when stopping impersonation
- **Audit trail:** All impersonation actions logged to SystemLog
- **JWT-based:** Impersonation state stored in JWT token (no DB changes)

### Error Handling Flow

```
┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Try     │
    └────┬────┘
         │
    ┌────▼────────────────────┐
    │ Error Occurred?         │
    └────┬────────────┬───────┘
         │ Yes        │ No
    ┌────▼────┐  ┌───▼────┐
    │ Catch   │  │Success │
    └────┬────┘  └────────┘
         │
    ┌────▼────────────────┐
    │ Log to SystemLog    │
    │ with stack trace    │
    └────┬────────────────┘
         │
    ┌────▼────────────────┐
    │ Return user-friendly│
    │ error message       │
    └────┬────────────────┘
         │
    ┌────▼────────────────┐
    │ Show toast/modal    │
    └─────────────────────┘
```

1. **Client errors:** Caught by Error Boundary → logged to `/api/log-error`
2. **Server errors:** Caught by `withErrorHandling` wrapper → logged to SystemLog
3. **Network errors:** Handled by TanStack Query retry logic

### Audit Trail

All mutations (Create/Update/Delete) automatically create audit logs:
- **Who:** User ID and name
- **What:** Entity type and ID
- **When:** Timestamp
- **Where:** IP address and user agent
- **Changes:** Before/after values (JSON diff)

Audit logs are:
- Immutable (cannot be edited or deleted)
- Filterable (by user, action, entity, date)
- Exportable (for compliance)
- OWNER-only access

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes with clear messages (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing TypeScript patterns
- Use Prettier for formatting (auto-format on save recommended)
- Write descriptive commit messages (use conventional commits)
- Add JSDoc comments for complex functions
- Maintain test coverage (when tests are added)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- **Documentation:** [docs/](docs/) folder contains detailed phase documentation
- **Deployment Guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/orbitflow-crm/issues)
- **Email:** support@orbitflow.io

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

---

**Built with ❤️ using Next.js, Prisma, and TypeScript**

**Deployed with 🚀 Coolify**
