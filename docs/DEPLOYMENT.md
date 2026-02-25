# OrbitFlow CRM - Deployment Guide

Complete deployment documentation for production environments.

---

## Table of Contents

1. [Coolify Deployment (Recommended)](#coolify-deployment)
2. [Alternative Deployment Platforms](#alternative-deployment-platforms)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Security Checklist](#security-checklist)
6. [Monitoring & Logging](#monitoring--logging)
7. [Scaling Considerations](#scaling-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Backup & Disaster Recovery](#backup--disaster-recovery)

---

## Coolify Deployment

### Architecture Overview

```
┌──────────────┐     HTTPS     ┌───────────────┐     Internal     ┌──────────────┐
│   Client     │──────────────→│    Coolify    │─────────────────→│  OrbitFlow   │
│  (Browser)   │               │ Reverse Proxy │                  │  Container   │
└──────────────┘               │  (Caddy/Nginx)│                  │  (Port 3000) │
                               └───────┬───────┘                  └──────┬───────┘
                                       │                                 │
                                       │ SSL/TLS                         │ TCP
                                       ▼                                 ▼
                               ┌───────────────┐                 ┌──────────────┐
                               │  Let's Encrypt│                 │   MariaDB    │
                               │  Certificate  │                 │  Container   │
                               └───────────────┘                 │  (Port 3306) │
                                                                 └──────────────┘
```

### Prerequisites

1. **Coolify Server:**
   - VPS with Ubuntu 22.04 or Debian 12
   - Minimum 2GB RAM, 2 CPU cores
   - 20GB+ storage
   - Public IP address

2. **Domain & DNS:**
   - Domain name registered
   - DNS A record pointing to Coolify server IP
   - Propagation complete (check with `dig your-domain.com`)

3. **Coolify Installation:**
   ```bash
   # SSH into your server
   ssh root@your-server-ip

   # Install Coolify
   curl -fsSL https://get.coolify.io | bash
   ```

   Follow installation prompts and access Coolify at `http://your-server-ip:8000`

---

### Step-by-Step Deployment Guide

#### Phase 1: Database Setup

**1.1 Create MariaDB Database**

1. Login to Coolify dashboard
2. Navigate to **Resources** → **New** → **Database**
3. Select **MariaDB**
4. Configure:
   - **Name:** `orbitflow-prod-db`
   - **Description:** "OrbitFlow CRM Production Database"
   - **MariaDB Version:** 10.11 (or latest stable)
   - **Root Password:** Click "Generate" (save this securely!)
   - **Database Name:** `orbitflow`
   - **User:** `orbitflow_user`
   - **User Password:** Click "Generate" (save this securely!)

5. **Advanced Settings:**
   - Memory Limit: `512MB` (or higher based on server resources)
   - CPU Limit: `1.0` (or higher)
   - Storage: `10GB` (adjust based on expected data volume)

6. Click **Deploy**
7. Wait for status to show "Running" (green indicator)

**1.2 Note Connection Details**

Once deployed, click on the database and find:
- **Internal Connection String:** `mysql://orbitflow_user:PASSWORD@orbitflow-prod-db:3306/orbitflow`
- **External Connection String:** (for direct access from your machine)

**Save these credentials securely** (use a password manager).

---

#### Phase 2: Application Setup

**2.1 Prepare Repository**

Ensure your code is pushed to GitHub/GitLab with:
- ✅ Dockerfile in root
- ✅ .dockerignore in root
- ✅ .env files NOT committed (only .env.example)
- ✅ All dependencies in package.json

**2.2 Create Application in Coolify**

1. In Coolify, navigate to **Resources** → **New** → **Application**
2. Select **Public Repository** (or connect GitHub/GitLab)
3. Configuration:
   - **Repository URL:** `https://github.com/yourusername/orbitflow-crm.git`
   - **Branch:** `main` (or `master`)
   - **Build Pack:** `Dockerfile` (Coolify auto-detects)
   - **Port:** `3000`
   - **Name:** `orbitflow-crm-prod`
   - **Description:** "OrbitFlow CRM Production Application"

4. **Advanced Settings:**
   - **Restart Policy:** `unless-stopped`
   - **Health Check Path:** `/api/health` (optional, not implemented yet)
   - **Health Check Timeout:** `30s`

5. Click **Create** (don't deploy yet - need to set environment variables first)

---

#### Phase 3: Environment Variables

**3.1 Configure Required Variables**

In your Coolify application:
1. Go to **Environment** tab
2. Add each variable below:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `DATABASE_URL` | Copy from MariaDB **Internal Connection String** | Replace `DATABASE` with `orbitflow` |
| `AUTH_SECRET` | Generate: `openssl rand -base64 32` | CRITICAL: Must be secure random string |
| `AUTH_URL` | `https://your-domain.com` | Your actual domain with HTTPS |
| `AUTH_TRUST_HOST` | `true` | Required for Coolify reverse proxy |
| `NODE_ENV` | `production` | Usually auto-set by Coolify |

**Example DATABASE_URL:**
```
mysql://orbitflow_user:abc123XYZ@orbitflow-prod-db:3306/orbitflow
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
# Example output: E/mOdmtbyfRy2qQi/UtSG2cSTNFfA+xjBKUq7d6t26o=
```

**3.2 Optional Variables (Add Later if Needed)**

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Quiz conversion tracking | `123456789012345` |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | Quiz conversion tracking | `ABC123XYZ` |
| `TZ` | Server timezone | `America/New_York` |

**3.3 Save Configuration**

Click **Save** to persist environment variables.

---

#### Phase 4: Initial Deployment

**4.1 Deploy Application**

1. In Coolify application page, click **Deploy** button
2. **Monitor Build Logs** (auto-opens):
   - Watch for `Stage 1: Dependencies` completion
   - Verify `npx prisma generate` success
   - Check `Stage 2: Builder` completion
   - Confirm `Stage 3: Runner` container start

**Expected build time:** 3-5 minutes (depends on server specs)

**4.2 Verify Container Running**

Once build completes:
- Status indicator shows **Running** (green)
- Check logs for `Server listening on port 3000`
- No error messages in logs

---

#### Phase 5: Database Initialization

**5.1 Run Prisma Migrations**

**Option A: Via Coolify Console (Recommended)**

1. In Coolify application, click **Console** tab
2. In the terminal, run:
   ```bash
   npx prisma migrate deploy
   ```
3. Wait for migrations to complete (should show "Migration applied" for each)

**Option B: Via SSH**

```bash
# SSH into Coolify server
ssh root@your-coolify-server

# Find container ID
docker ps | grep orbitflow

# Execute migration command
docker exec -it <container-id> npx prisma migrate deploy
```

**5.2 Seed Database (Optional)**

For demo/testing environment:
```bash
# Via Coolify Console or docker exec
npm run seed
```

**⚠️ WARNING:** This creates default passwords. **Change them immediately** after first login!

**Production:** Skip seeding. Create users manually via super admin dashboard.

---

#### Phase 6: Domain Configuration

**6.1 Add Domain to Coolify**

1. In application settings, go to **Domains** section
2. Click **Add Domain**
3. Enter: `crm.yourdomain.com` (or your chosen subdomain)
4. **Enable HTTPS:** Toggle ON (Coolify uses Let's Encrypt)
5. **Force HTTPS Redirect:** Toggle ON
6. Click **Save**

**6.2 Verify SSL Certificate**

Coolify automatically:
- Requests Let's Encrypt certificate
- Configures reverse proxy (Caddy)
- Sets up automatic renewal

Check status:
- Green lock icon next to domain = SSL active
- Click "Test" to verify HTTPS works

**6.3 Update AUTH_URL**

1. Go back to **Environment** tab
2. Update `AUTH_URL` to match your domain exactly:
   ```
   https://crm.yourdomain.com
   ```
3. **Restart application** (click "Restart" button)

---

#### Phase 7: Verification

**7.1 Access Application**

Visit `https://crm.yourdomain.com`

**Expected:**
- HTTPS connection (green padlock)
- Login page loads correctly
- No console errors (press F12 to check)

**7.2 Test Authentication**

1. Login with super admin credentials (if seeded):
   - Username: `superadmin`
   - Subscription ID: `platform`
   - Password: `SuperAdmin@123`

2. **Immediately change password** in settings!

**7.3 Verify Database Connection**

1. Navigate to **Super Admin** → **System Logs**
2. Check for any database connection errors
3. Try creating a test user in **Settings** → **Users**

**7.4 Test Core Features**

- ✅ Create a lead manually
- ✅ Move lead between statuses (Kanban drag-drop)
- ✅ Create a quiz and publish
- ✅ View analytics dashboard
- ✅ Check audit logs

---

### Post-Deployment Tasks

#### Change Default Passwords

If you seeded the database, change these passwords immediately:

1. Login as each user
2. Go to **Settings** → **Profile**
3. Change password to strong, unique password
4. Logout and verify new password works

#### Create Your First Company

As super admin:
1. Navigate to **Super Admin** → **Companies**
2. Click **Add Company**
3. Fill in:
   - Company name
   - Subscription ID (slug, e.g., `acme`)
   - Plan (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
   - Quotas (max users, max quizzes)

#### Create Owner User for Company

1. **Super Admin** → **Companies** → Select company → **Users** tab
2. Click **Add User**
3. Create OWNER role user with strong password
4. Provide credentials to company owner

---

## Alternative Deployment Platforms

### Vercel Deployment

**Pros:**
- Zero-configuration deployment
- Automatic HTTPS and CDN
- GitHub integration
- Free tier available

**Cons:**
- Serverless limitations (10-second timeout)
- No built-in database hosting
- Requires external database (PlanetScale, Railway)

**Steps:**

1. **Prepare Database:**
   - Sign up for PlanetScale or Railway
   - Create MySQL database
   - Note connection string

2. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and deploy
   vercel login
   vercel --prod
   ```

3. **Set Environment Variables:**
   - Vercel dashboard → Project → Settings → Environment Variables
   - Add all required variables from .env.production.example

4. **Run Migrations:**
   ```bash
   # Locally, pointing to production database
   DATABASE_URL="production-url" npx prisma migrate deploy
   ```

**Note:** Vercel's serverless nature may cause cold starts. Consider Coolify for better performance.

---

### Railway Deployment

**Pros:**
- Simple Git-based deployment
- Integrated database hosting
- Pay-as-you-go pricing
- Good developer experience

**Cons:**
- More expensive than self-hosting
- Limited free tier ($5/month credit)

**Steps:**

1. **Sign up:** [railway.app](https://railway.app)
2. **New Project:**
   - Connect GitHub repository
   - Add **MariaDB** service from marketplace
3. **Configure:**
   - Set environment variables in Railway dashboard
   - Railway auto-detects Dockerfile
4. **Deploy:**
   - Push to GitHub
   - Railway auto-deploys
5. **Migrations:**
   - Use Railway CLI: `railway run npx prisma migrate deploy`

---

### VPS with Docker Compose

For manual deployment on any VPS (DigitalOcean, Linode, Vultr):

**1. Install Docker & Docker Compose:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | bash

# Install Docker Compose
sudo apt install docker-compose -y
```

**2. Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://orbitflow:password@db:3306/orbitflow
      AUTH_SECRET: your-secret-here
      AUTH_URL: https://your-domain.com
      AUTH_TRUST_HOST: "true"
      NODE_ENV: production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: root-password
      MYSQL_DATABASE: orbitflow
      MYSQL_USER: orbitflow
      MYSQL_PASSWORD: password
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db-data:
```

**3. Deploy:**
```bash
# Clone repo
git clone your-repo-url
cd orbitflow-crm

# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

**4. Set up Nginx as reverse proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**5. Install SSL with Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Database Configuration

### Connection Pooling

Prisma v7 with MariaDB adapter uses connection pooling automatically.

**Current configuration** (in `src/lib/prisma.ts`):
```typescript
const adapter = new PrismaMariaDb({
  connectionLimit: 5, // Default pool size
})
```

**Recommended Pool Sizes:**

| Environment | Users | Pool Size |
|-------------|-------|-----------|
| Development | 1-5 | 5 |
| Small Production | <100 | 10-20 |
| Medium Production | 100-1000 | 20-50 |
| Large Production | 1000+ | 50-100 |

**Adjust in `src/lib/prisma.ts`:**
```typescript
const adapter = new PrismaMariaDb({
  connectionLimit: parseInt(process.env.DB_POOL_SIZE || '20'),
})
```

Then set `DB_POOL_SIZE` environment variable in Coolify.

---

### Migration Strategy

#### Development Workflow

```bash
# 1. Make schema changes in prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name descriptive_name

# 3. Review generated SQL in prisma/migrations/

# 4. Test locally

# 5. Commit migration files to Git
git add prisma/migrations/
git commit -m "Add migration: descriptive_name"
```

#### Production Workflow

**Manual Deployment (Recommended for Critical Changes):**

```bash
# 1. Backup database first!
docker exec orbitflow-db mysqldump -u root -p orbitflow > backup.sql

# 2. Test migration locally against backup
DATABASE_URL="local-test-db" npx prisma migrate deploy

# 3. Apply to production
docker exec -it <container-id> npx prisma migrate deploy

# 4. Verify application starts correctly

# 5. Monitor for errors
```

**Automated Deployment (CI/CD):**

Add to GitHub Actions workflow:
```yaml
- name: Run Database Migrations
  run: |
    docker exec ${{ secrets.CONTAINER_ID }} npx prisma migrate deploy
```

**Rollback Strategy:**

If migration fails:
```bash
# Restore from backup
docker exec -i orbitflow-db mysql -u root -p orbitflow < backup.sql

# Revert application to previous version
git revert HEAD
git push
```

---

### Database Backups

**Automated Daily Backup Script:**

```bash
#!/bin/bash
# /root/backup-orbitflow.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/orbitflow"
FILENAME="orbitflow_$TIMESTAMP.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Dump database
docker exec orbitflow-db mysqldump \
  -u root \
  -p${MYSQL_ROOT_PASSWORD} \
  orbitflow \
  > "$BACKUP_DIR/$FILENAME"

# Compress backup
gzip "$BACKUP_DIR/$FILENAME"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${FILENAME}.gz"
```

**Set up Cron:**
```bash
chmod +x /root/backup-orbitflow.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /root/backup-orbitflow.sh >> /var/log/orbitflow-backup.log 2>&1
```

**Restore from Backup:**
```bash
# Decompress
gunzip backup.sql.gz

# Restore
docker exec -i orbitflow-db mysql -u root -p orbitflow < backup.sql
```

---

## Environment Variables

### Deep Dive

#### DATABASE_URL

**Format:** `mysql://USER:PASSWORD@HOST:PORT/DATABASE`

**Components:**
- `USER`: Database user (e.g., `orbitflow_user`)
- `PASSWORD`: User password (URL-encode special characters!)
- `HOST`: Hostname (`localhost`, `db`, or `orbitflow-db` for Coolify)
- `PORT`: `3306` (default MariaDB/MySQL port)
- `DATABASE`: Database name (`orbitflow`)

**Special Characters in Passwords:**

If password contains `@`, `#`, `:`, etc., URL-encode them:
```
# Original password: Pa$$w0rd!
# URL-encoded: Pa%24%24w0rd%21
mysql://user:Pa%24%24w0rd%21@host:3306/db
```

**SSL Connection (Production):**
```
mysql://user:pass@host:3306/db?sslmode=require
```

#### AUTH_SECRET

**Purpose:** Encrypts JWT tokens for session management.

**Requirements:**
- Minimum 32 characters
- Cryptographically secure random string
- Different for each environment (dev, staging, prod)

**Generation:**
```bash
# Method 1: OpenSSL (recommended)
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Security:**
- NEVER commit to Git
- Rotate periodically (invalidates existing sessions)
- Store securely (password manager, secrets vault)

#### AUTH_URL

**Purpose:** Base URL for NextAuth callbacks and redirects.

**Format:** `https://domain.com` (no trailing slash)

**Rules:**
- MUST be HTTPS in production (except localhost)
- Must match actual domain exactly
- No paths (just protocol + domain)
- Port included if non-standard (e.g., `https://example.com:8443`)

**Examples:**
- ✅ `https://crm.example.com`
- ✅ `http://localhost:3000` (development only)
- ❌ `https://crm.example.com/` (trailing slash)
- ❌ `crm.example.com` (missing protocol)

#### AUTH_TRUST_HOST

**Purpose:** Allows NextAuth to trust reverse proxy headers.

**When to use:**
- ✅ Behind Coolify reverse proxy
- ✅ Behind Nginx, Apache, Caddy
- ✅ Behind Vercel, Railway
- ❌ Direct connection (no proxy)

**Value:** Always `true` when using reverse proxy

---

### Multi-Environment Setup

#### Development (.env.local)
```env
DATABASE_URL="mysql://root:dev@localhost:3306/orbitflow_dev"
AUTH_SECRET="dev-secret-not-for-production"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=false
```

#### Staging (.env.staging - not committed)
```env
DATABASE_URL="mysql://staging_user:pass@staging-db:3306/orbitflow_staging"
AUTH_SECRET="staging-unique-secret-32-chars"
AUTH_URL="https://staging.crm.example.com"
AUTH_TRUST_HOST=true
```

#### Production (Set in Coolify/hosting platform)
```env
DATABASE_URL="mysql://prod_user:secure_pass@prod-db:3306/orbitflow"
AUTH_SECRET="production-super-secret-key-32"
AUTH_URL="https://crm.example.com"
AUTH_TRUST_HOST=true
NODE_ENV=production
```

---

## Security Checklist

### Pre-Deployment

- [ ] `.env` files are in `.gitignore` (never committed)
- [ ] `AUTH_SECRET` is unique, 32+ characters, cryptographically random
- [ ] `AUTH_URL` is HTTPS (not HTTP) in production
- [ ] Database password is strong (16+ chars, mixed case, symbols, numbers)
- [ ] Database SSL connection enabled (if remote database)
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key-based authentication (password auth disabled)
- [ ] Server OS is updated (`apt update && apt upgrade`)
- [ ] Fail2ban installed for SSH brute-force protection
- [ ] Non-root user created for deployments
- [ ] Prisma schema reviewed for sensitive fields
- [ ] `.dockerignore` excludes .env files
- [ ] Default seeded passwords documented for changing
- [ ] CORS settings reviewed (if using external APIs)

### Post-Deployment

- [ ] Changed all default seeded passwords
- [ ] Tested authentication flows (login, logout, session timeout)
- [ ] Verified RBAC enforcement (tested each role's access)
- [ ] Audit logs are recording actions
- [ ] Error logging works (triggered intentional error)
- [ ] Backup system tested (created and restored backup)
- [ ] SSL certificate is valid (A+ rating on ssllabs.com)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting implemented on public endpoints (`/q/...`)
- [ ] Database backups scheduled (daily cron job)
- [ ] Monitoring alerts configured (uptime, errors, disk space)
- [ ] Secrets rotated from default values
- [ ] Application logs reviewed for sensitive data leaks
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)

### Ongoing Security

- [ ] Weekly security updates (`apt update && apt upgrade`)
- [ ] Monthly dependency updates (`npm update`)
- [ ] Quarterly `AUTH_SECRET` rotation
- [ ] Review audit logs monthly
- [ ] Test backups quarterly (restore to staging)
- [ ] Review user permissions quarterly
- [ ] Scan for unused user accounts
- [ ] Monitor SystemLog for suspicious activity
- [ ] Review failed login attempts
- [ ] Update SSL certificates before expiry (auto-renew enabled)

---

## Monitoring & Logging

### Application Logs

**View in Coolify:**
1. Dashboard → Application → **Logs** tab
2. Real-time streaming (auto-scrolls)
3. Filter by log level

**View via Docker:**
```bash
# Real-time logs
docker logs -f <container-id>

# Last 100 lines
docker logs --tail 100 <container-id>

# Since timestamp
docker logs --since 2024-01-01T12:00:00 <container-id>
```

**Important Log Patterns:**

✅ **Healthy:**
```
Server listening on port 3000
Prisma schema loaded
```

❌ **Errors to watch:**
```
Error: connect ECONNREFUSED
PrismaClientKnownRequestError
```

---

### System Logs (Database)

**Access via Super Admin:**
1. Login as super admin
2. Navigate to **Super Admin** → **System Logs**
3. Filter by:
   - **Level:** ERROR, WARN, INFO
   - **Source:** CLIENT, SERVER_ACTION, API_ROUTE
   - **Date Range:** Last 7 days, 30 days, custom

**Query Directly:**
```sql
-- View recent errors
SELECT * FROM SystemLog
WHERE level = 'ERROR'
ORDER BY timestamp DESC
LIMIT 50;

-- Count errors by endpoint
SELECT endpoint, COUNT(*) as count
FROM SystemLog
WHERE level = 'ERROR'
GROUP BY endpoint
ORDER BY count DESC;
```

---

### Performance Monitoring

**Coolify Resource Usage:**
- Dashboard shows CPU, memory, network graphs
- Set alerts for high resource usage

**Custom Monitoring (Optional):**

Install Prometheus + Grafana for advanced metrics:

```bash
# Install on Coolify server
docker-compose -f monitoring.yml up -d
```

**Metrics to track:**
- Response time (p50, p95, p99)
- Error rate
- Active users
- Database query time
- Memory usage
- CPU usage

**Recommended Tools:**
- **Sentry:** Error tracking and performance monitoring
- **LogRocket:** Session replay and debugging
- **Plausible:** Privacy-friendly analytics (alternative to Google Analytics)

---

## Scaling Considerations

### Horizontal Scaling

**When to scale horizontally:**
- Consistent high CPU usage (>70%)
- Response time degradation (>500ms avg)
- Approaching 1000+ concurrent users

**How to scale in Coolify:**
1. Navigate to application settings
2. **Scaling** section
3. Increase **Replicas** to `2` or `3`
4. Coolify automatically load-balances traffic

**Requirements for horizontal scaling:**
- ✅ **Stateless application:** OrbitFlow is stateless (JWT sessions, no server-side state)
- ✅ **Shared database:** All replicas connect to same MariaDB instance
- ✅ **No local file storage:** All data in database (no uploads to disk)
- ✅ **Load balancer:** Coolify provides automatically

**Considerations:**
- Database becomes bottleneck (scale database separately)
- Connection pool sizing (multiply by number of replicas)
- WebSocket support may need sticky sessions

---

### Vertical Scaling

**When to scale vertically:**
- Database CPU >70%
- Memory usage >80%
- Slow database queries

**VPS Size Recommendations:**

| Users | CPU | RAM | Disk | Database Pool Size |
|-------|-----|-----|------|-------------------|
| <100 | 1 core | 2GB | 20GB | 10 |
| 100-500 | 2 cores | 4GB | 40GB | 20 |
| 500-2000 | 4 cores | 8GB | 80GB | 50 |
| 2000-5000 | 8 cores | 16GB | 160GB | 100 |
| 5000+ | 16+ cores | 32GB+ | 320GB+ | 200+ |

**Coolify VPS upgrade:**
1. Upgrade VPS plan with hosting provider
2. Restart Coolify server
3. No configuration changes needed (Coolify adapts automatically)

---

### Database Scaling

**Read Replicas:**

For read-heavy workloads:
1. Set up MariaDB replication
2. Direct read queries to replicas
3. Write queries go to primary

**Prisma configuration:**
```typescript
// Not yet implemented in OrbitFlow
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL, // Primary (writes)
    },
  },
  // Replica extension (manual implementation needed)
})
```

**Connection Pooling:**

Increase `connectionLimit` based on load:
```typescript
new PrismaMariaDb({
  connectionLimit: 50, // Increase from default 5
})
```

Monitor connections:
```sql
SHOW PROCESSLIST;
```

---

## Troubleshooting

### Build Failures

#### Error: "Prisma client not generated"

**Symptoms:**
```
Error: Cannot find module '@/generated/prisma/client'
```

**Solution:**
1. Verify Dockerfile has `RUN npx prisma generate` in deps stage
2. Check `prisma.config.ts` exists
3. Ensure `prisma/schema.prisma` is committed to Git
4. Rebuild: `docker build -t test .`

**Verify locally:**
```bash
npm run build
# Should succeed without errors
```

---

#### Error: "Invalid AUTH_SECRET"

**Symptoms:**
- Login page loads but submit fails
- Error: "Invalid session"

**Solution:**
1. Regenerate AUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```
2. Update in Coolify environment variables
3. Restart application
4. Clear browser cookies and retry

---

### Database Connection Errors

#### Error: "connect ECONNREFUSED"

**Symptoms:**
```
PrismaClientInitializationError: Can't reach database server
```

**Solution:**
1. **Check DATABASE_URL format:**
   ```
   mysql://user:pass@host:3306/database
   ```
2. **For Coolify:** Use internal hostname (`orbitflow-db`, not `localhost`)
3. **Verify database is running:**
   ```bash
   docker ps | grep mariadb
   ```
4. **Test connection from app container:**
   ```bash
   docker exec -it <app-container> ping orbitflow-db
   ```

---

#### Error: "Access denied for user"

**Symptoms:**
```
Error: Access denied for user 'orbitflow'@'%'
```

**Solution:**
1. Verify password in DATABASE_URL (check for special characters)
2. URL-encode password if it contains `@`, `:`, `/`, etc.
3. Check user permissions in MariaDB:
   ```sql
   SHOW GRANTS FOR 'orbitflow'@'%';
   ```
4. Recreate user if needed:
   ```sql
   DROP USER 'orbitflow'@'%';
   CREATE USER 'orbitflow'@'%' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON orbitflow.* TO 'orbitflow'@'%';
   FLUSH PRIVILEGES;
   ```

---

### Runtime Errors

#### Error: 502 Bad Gateway

**Symptoms:**
- Nginx/Caddy returns 502
- Application not accessible

**Causes & Solutions:**

1. **Container not running:**
   ```bash
   docker ps | grep orbitflow
   # If not listed, check logs:
   docker logs <container-id>
   ```

2. **Wrong port exposed:**
   - Verify Dockerfile has `EXPOSE 3000`
   - Coolify application settings show port `3000`

3. **Application crashed on startup:**
   ```bash
   docker logs --tail 50 <container-id>
   # Look for error stack traces
   ```

4. **Environment variable missing:**
   - Check all required variables are set in Coolify
   - Restart application after adding variables

---

#### Error: "An unexpected error occurred"

**Symptoms:**
- Generic error modal in UI
- Feature not working (create lead, etc.)

**Solution:**
1. **Check browser console** (F12):
   - Network tab for failed requests
   - Console tab for JavaScript errors

2. **Check server logs:**
   ```bash
   docker logs -f <container-id>
   ```

3. **Check SystemLog** (Super Admin → Logs):
   - Filter by ERROR level
   - Find stack trace
   - Look for error ID to correlate with UI error

4. **Common causes:**
   - Missing permissions (RBAC issue)
   - Database constraint violation
   - Invalid input data
   - Impersonation guard blocking write action

---

### Performance Issues

#### Slow Page Load (>3 seconds)

**Diagnosis:**
1. **Check database queries:**
   ```sql
   -- Enable slow query log
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 1; -- 1 second

   -- View slow queries
   SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
   ```

2. **Check server resources:**
   - Coolify dashboard → Resource usage graphs
   - Look for CPU/memory spikes

**Solutions:**
- Add database indexes (see `prisma/schema.prisma` - most critical indexes already defined)
- Increase database connection pool size
- Upgrade VPS if consistently high resource usage
- Enable Redis caching (future enhancement)

---

#### High Memory Usage

**Diagnosis:**
```bash
# Check container memory
docker stats <container-id>
```

**Solutions:**
1. **Restart container** (temporary):
   ```bash
   docker restart <container-id>
   ```

2. **Increase memory limit** (Coolify):
   - Application → Settings → Memory Limit → `2GB` or higher

3. **Optimize Prisma queries:**
   - Use `select` to fetch only needed fields
   - Avoid N+1 queries (use `include` carefully)
   - Paginate large datasets

4. **Check for memory leaks:**
   - Monitor memory over 24 hours
   - If steadily increasing → code issue (investigate in Super Admin logs)

---

## Backup & Disaster Recovery

### Automated Backups

**Database Backup Script:**

See [Database Backups section](#database-backups) above for full script.

**Application Code Backup:**

Code is in Git (no separate backup needed). Ensure:
- Remote repository is up-to-date
- `.env` files are NOT committed
- Secrets stored separately (password manager)

---

### Restore Procedures

#### Restore Database from Backup

```bash
# 1. Stop application (prevents new writes)
docker stop <app-container>

# 2. Decompress backup
gunzip backup_20240101_020000.sql.gz

# 3. Restore to database
docker exec -i <db-container> mysql -u root -p orbitflow < backup_20240101_020000.sql

# 4. Verify restoration
docker exec -i <db-container> mysql -u root -p orbitflow -e "SELECT COUNT(*) FROM Lead;"

# 5. Restart application
docker start <app-container>
```

---

#### Restore Application to Previous Version

```bash
# 1. Find previous commit hash
git log --oneline

# 2. Revert to previous version
git reset --hard <commit-hash>

# 3. Force push (if already deployed)
git push -f origin main

# 4. Coolify auto-deploys on push

# 5. Verify application works
# 6. If OK, create new commit to preserve revert
git commit -m "Reverted to stable version"
git push origin main
```

---

### Disaster Recovery Plan

**Scenario: Complete Server Failure**

**Prerequisites:**
- ✅ Off-site database backups (daily, stored in different location)
- ✅ Git repository hosted on GitHub/GitLab (not same server)
- ✅ `.env` variables documented securely (password manager)
- ✅ DNS managed separately (Cloudflare, etc.)

**Recovery Steps:**

1. **Provision new server:**
   - Same size or larger VPS
   - Same OS (Ubuntu 22.04)
   - Note new IP address

2. **Install Coolify:**
   ```bash
   curl -fsSL https://get.coolify.io | bash
   ```

3. **Update DNS:**
   - Point A record to new server IP
   - Wait for propagation (use old server temporarily)

4. **Restore database:**
   - Create MariaDB in Coolify
   - Upload latest backup
   - Restore using `mysql` command

5. **Deploy application:**
   - Create application in Coolify
   - Connect to Git repository
   - Set all environment variables (from password manager)
   - Deploy

6. **Verify:**
   - Test login
   - Check all features
   - Verify data integrity

7. **Monitor:**
   - Watch logs for errors
   - Check resource usage
   - Notify users of brief downtime

**Total Recovery Time Objective (RTO):** ~2-4 hours

---

## Summary

**Deployment checklist:**
- ✅ Coolify installed and configured
- ✅ MariaDB database created and connection tested
- ✅ Application deployed with correct environment variables
- ✅ Prisma migrations applied
- ✅ Domain configured with HTTPS
- ✅ Default passwords changed
- ✅ Backups configured (daily cron job)
- ✅ Monitoring enabled
- ✅ Security checklist completed
- ✅ Documentation reviewed

**Need Help?**
- Check [GitHub Issues](https://github.com/yourusername/orbitflow-crm/issues)
- Review main [README.md](../README.md)
- Email: support@orbitflow.io

---

**Last Updated:** 2024-01-01
**Version:** 1.0.0
