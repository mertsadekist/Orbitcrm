import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

async function main() {
  console.log("🧹 Cleaning existing data...");
  await prisma.systemLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // ─── 1. PLATFORM Company + Super Admin ────────────────

  console.log("🏢 Creating PLATFORM company...");
  const platform = await prisma.company.create({
    data: {
      subscriptionId: "100000",
      name: "OrbitFlow Platform",
      slug: "platform",
      plan: "ENTERPRISE",
      maxUsers: 100,
      maxQuizzes: 0,
      isActive: true,
    },
  });

  const superadmin = await prisma.user.create({
    data: {
      companyId: platform.id,
      username: "superadmin",
      email: "admin@orbitflow.io",
      passwordHash: hash("SuperAdmin@123"),
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Super Admin created: superadmin / SuperAdmin@123");

  // ─── 2. Acme Corporation (Demo Company) ───────────────

  console.log("🏢 Creating Acme Corporation...");
  const acme = await prisma.company.create({
    data: {
      subscriptionId: "200001",
      name: "Acme Corporation",
      slug: "acme-corp",
      industry: "Technology",
      email: "info@acme.com",
      phone: "+1-555-0100",
      website: "https://acme.example.com",
      plan: "PROFESSIONAL",
      maxUsers: 25,
      maxQuizzes: 10,
      isActive: true,
    },
  });

  // ─── 3. Acme Users ────────────────────────────────────

  console.log("👥 Creating Acme users...");
  const john = await prisma.user.create({
    data: {
      companyId: acme.id,
      username: "john.owner",
      email: "john@acme.com",
      passwordHash: hash("Password@123"),
      firstName: "John",
      lastName: "Carter",
      role: "OWNER",
    },
  });

  const sarah = await prisma.user.create({
    data: {
      companyId: acme.id,
      username: "sarah.manager",
      email: "sarah@acme.com",
      passwordHash: hash("Password@123"),
      firstName: "Sarah",
      lastName: "Chen",
      role: "MANAGER",
    },
  });

  const mike = await prisma.user.create({
    data: {
      companyId: acme.id,
      username: "mike.sales",
      email: "mike@acme.com",
      passwordHash: hash("Password@123"),
      firstName: "Mike",
      lastName: "Johnson",
      role: "EMPLOYEE",
    },
  });

  const emma = await prisma.user.create({
    data: {
      companyId: acme.id,
      username: "emma.sales",
      email: "emma@acme.com",
      passwordHash: hash("Password@123"),
      firstName: "Emma",
      lastName: "Wilson",
      role: "EMPLOYEE",
    },
  });
  console.log("✅ 4 Acme users created (all Password@123)");

  // ─── 4. Quiz ──────────────────────────────────────────

  console.log("📝 Creating quiz...");
  const quiz = await prisma.quiz.create({
    data: {
      companyId: acme.id,
      title: "Business Needs Assessment",
      description: "Help us understand your business needs to provide the best solution.",
      slug: "business-needs",
      isPublished: true,
      config: {
        version: 1,
        questions: [
          {
            id: "q1",
            type: "radio",
            questionText: "What is your company size?",
            required: true,
            weight: 5,
            options: [
              { label: "1-10 employees", value: "small", score: 3 },
              { label: "11-50 employees", value: "medium", score: 6 },
              { label: "51-200 employees", value: "large", score: 8 },
              { label: "200+ employees", value: "enterprise", score: 10 },
            ],
          },
          {
            id: "q2",
            type: "radio",
            questionText: "What is your primary challenge?",
            required: true,
            weight: 8,
            options: [
              { label: "Lead generation", value: "leads", score: 9 },
              { label: "Customer retention", value: "retention", score: 7 },
              { label: "Sales pipeline", value: "pipeline", score: 8 },
              { label: "Team management", value: "team", score: 5 },
            ],
          },
          {
            id: "q3",
            type: "text",
            questionText: "Tell us more about your needs",
            required: false,
            weight: 2,
            placeholder: "Describe your biggest pain point...",
          },
          {
            id: "q4",
            type: "email",
            questionText: "Your email address",
            required: true,
            weight: 1,
            placeholder: "you@company.com",
          },
          {
            id: "q5",
            type: "name",
            questionText: "Your full name",
            required: true,
            weight: 1,
          },
        ],
        settings: {
          showProgressBar: true,
          thankYouMessage: "Thank you for completing our assessment! We'll be in touch soon.",
          redirectUrl: null,
        },
        tracking: {},
        welcomeScreen: { enabled: false },
      },
    },
  });
  console.log("✅ Quiz created: Business Needs Assessment");

  // ─── 5. Leads ─────────────────────────────────────────

  console.log("📋 Creating leads...");
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        companyId: acme.id,
        quizId: quiz.id,
        assignedToId: mike.id,
        firstName: "Alice",
        lastName: "Brown",
        email: "alice@techstart.io",
        phone: "+1234567890",
        companyName: "TechStart Inc",
        status: "NEW",
        source: "quiz",
        score: 75,
        quizResponses: [
          { questionId: "q1", answer: "medium", questionText: "Company size?" },
          { questionId: "q2", answer: "leads", questionText: "Primary challenge?" },
        ],
      },
    }),
    prisma.lead.create({
      data: {
        companyId: acme.id,
        quizId: quiz.id,
        assignedToId: mike.id,
        firstName: "Bob",
        lastName: "Smith",
        email: "bob@globalcorp.com",
        phone: "+1234567891",
        companyName: "Global Corp",
        status: "CONTACTED",
        source: "quiz",
        score: 60,
      },
    }),
    prisma.lead.create({
      data: {
        companyId: acme.id,
        quizId: quiz.id,
        assignedToId: emma.id,
        firstName: "Carol",
        lastName: "Davis",
        email: "carol@innovate.co",
        phone: "+1234567892",
        companyName: "Innovate Co",
        status: "QUALIFIED",
        source: "quiz",
        score: 90,
      },
    }),
    prisma.lead.create({
      data: {
        companyId: acme.id,
        firstName: "Dan",
        lastName: "Miller",
        email: "dan@smallbiz.net",
        phone: "+1234567893",
        companyName: "SmallBiz Net",
        status: "UNQUALIFIED",
        source: "manual",
        score: 30,
      },
    }),
    prisma.lead.create({
      data: {
        companyId: acme.id,
        quizId: quiz.id,
        assignedToId: emma.id,
        firstName: "Eve",
        lastName: "Taylor",
        email: "eve@megastore.com",
        phone: "+1234567894",
        companyName: "MegaStore",
        status: "CONVERTED",
        source: "quiz",
        score: 95,
        convertedAt: new Date(),
      },
    }),
  ]);
  console.log("✅ 5 leads created (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED)");

  // ─── 6. Deals ─────────────────────────────────────────

  console.log("💰 Creating deals...");
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        companyId: acme.id,
        leadId: leads[2].id,
        assignedToId: emma.id,
        title: "Innovate Co - CRM Implementation",
        value: 75000,
        stage: "PROPOSAL",
        probability: 60,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        companyId: acme.id,
        leadId: leads[4].id,
        assignedToId: emma.id,
        title: "MegaStore - Enterprise Package",
        value: 150000,
        stage: "CLOSED_WON",
        probability: 100,
        closedAt: new Date(),
      },
    }),
    prisma.deal.create({
      data: {
        companyId: acme.id,
        leadId: leads[1].id,
        assignedToId: mike.id,
        title: "Global Corp - Starter Package",
        value: 250000,
        stage: "NEGOTIATION",
        probability: 40,
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log("✅ 3 deals created (PROPOSAL $75K, CLOSED_WON $150K, NEGOTIATION $250K)");

  // ─── 7. Commissions ───────────────────────────────────

  console.log("💵 Creating commissions...");
  await prisma.commission.create({
    data: {
      companyId: acme.id,
      dealId: deals[1].id,
      userId: emma.id,
      amount: 15000,
      percentage: 10,
      status: "APPROVED",
    },
  });
  await prisma.commission.create({
    data: {
      companyId: acme.id,
      dealId: deals[0].id,
      userId: emma.id,
      amount: 7500,
      percentage: 10,
      status: "PENDING",
    },
  });
  console.log("✅ 2 commissions created (APPROVED $15K, PENDING $7.5K)");

  // ─── 8. Audit Logs ────────────────────────────────────

  console.log("📜 Creating audit logs...");
  await prisma.auditLog.create({
    data: {
      companyId: acme.id,
      userId: john.id,
      action: "LOGIN",
      entity: "User",
      entityId: john.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      companyId: acme.id,
      userId: sarah.id,
      action: "CREATE",
      entity: "Quiz",
      entityId: quiz.id,
      newValues: { title: "Business Needs Assessment" },
    },
  });
  await prisma.auditLog.create({
    data: {
      companyId: acme.id,
      userId: emma.id,
      action: "UPDATE",
      entity: "Deal",
      entityId: deals[1].id,
      oldValues: { stage: "NEGOTIATION" },
      newValues: { stage: "CLOSED_WON" },
    },
  });
  console.log("✅ 3 audit logs created");

  // ─── 9. Notifications ─────────────────────────────────

  console.log("🔔 Creating notifications...");
  await prisma.notification.create({
    data: {
      companyId: acme.id,
      userId: mike.id,
      type: "LEAD_ASSIGNED",
      title: "New Lead Assigned",
      message: "Alice Brown has been assigned to you.",
    },
  });
  await prisma.notification.create({
    data: {
      companyId: acme.id,
      userId: emma.id,
      type: "DEAL_UPDATE",
      title: "Deal Closed!",
      message: "MegaStore - Enterprise Package has been marked as CLOSED_WON.",
    },
  });
  await prisma.notification.create({
    data: {
      companyId: acme.id,
      userId: john.id,
      type: "INFO",
      title: "Welcome to OrbitFlow",
      message: "Your account has been set up successfully.",
      isRead: true,
    },
  });
  console.log("✅ 3 notifications created");

  // ─── 10. System Logs (sample data for logging feature) ─

  console.log("📊 Creating system logs...");
  await prisma.systemLog.createMany({
    data: [
      {
        level: "INFO",
        message: "Application started successfully",
        source: "SERVER_ACTION",
        endpoint: "app-init",
      },
      {
        level: "INFO",
        message: "User logged in successfully",
        source: "SERVER_ACTION",
        endpoint: "authorize",
        userId: john.id,
        companyId: acme.id,
      },
      {
        level: "ERROR",
        message: "Failed to fetch lead data: Connection timeout",
        stack:
          "Error: Connection timeout\n    at fetchLeads (src/actions/leads/get-leads.ts:15:11)\n    at async handler (src/app/api/leads/route.ts:8:20)",
        source: "SERVER_ACTION",
        endpoint: "getLeads",
        userId: mike.id,
        companyId: acme.id,
        metadata: { filters: { status: "NEW" } },
      },
      {
        level: "WARN",
        message: "Rate limit approaching for API route",
        source: "API_ROUTE",
        endpoint: "/api/public/quiz",
        metadata: { requestCount: 95, limit: 100 },
      },
      {
        level: "ERROR",
        message: "Prisma query failed: Record not found",
        stack:
          "Error: Record not found\n    at Object.getLeadById (src/actions/leads/get-lead.ts:22:5)\n    at async handler (src/app/api/leads/[id]/route.ts:10:18)",
        source: "SERVER_ACTION",
        endpoint: "getLeadById",
        userId: sarah.id,
        companyId: acme.id,
        metadata: { leadId: "nonexistent-id" },
      },
      {
        level: "WARN",
        message: "Deprecated API endpoint called",
        source: "API_ROUTE",
        endpoint: "/api/v1/leads",
        metadata: {
          deprecatedSince: "2024-01-01",
          suggestedAlternative: "/api/v2/leads",
        },
      },
      {
        level: "ERROR",
        message:
          "Unhandled client-side error: Cannot read properties of undefined (reading 'map')",
        stack:
          "TypeError: Cannot read properties of undefined (reading 'map')\n    at LeadList (src/components/leads/lead-list.tsx:42:18)\n    at renderWithHooks (react-dom.development.js:16305:18)",
        source: "CLIENT",
        endpoint: "/leads",
        metadata: { browser: "Chrome 120", url: "http://localhost:3000/leads" },
      },
    ],
  });
  console.log("✅ 7 system logs created (2 ERROR, 2 WARN, 2 INFO, 1 CLIENT ERROR)");

  console.log("\n🎉 Seed completed successfully!");
  console.log("─────────────────────────────────");
  console.log("Login credentials:");
  console.log("  Super Admin: 100000 / superadmin / SuperAdmin@123");
  console.log("  Owner:       200001 / john.owner / Password@123");
  console.log("  Manager:     200001 / sarah.manager / Password@123");
  console.log("  Employee:    200001 / mike.sales / Password@123");
  console.log("  Employee:    200001 / emma.sales / Password@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
