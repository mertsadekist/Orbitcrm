import archiver from "archiver";
import { PassThrough } from "stream";
import { exportCompanyData, type CompanyBackupData } from "./export-company-data";

export async function buildBackupZip(companyId: string, companyName: string) {
  // Fetch all company data
  const data = await exportCompanyData(companyId);

  // Create a PassThrough stream to pipe the archive through
  const stream = new PassThrough();

  // Create archiver instance
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Maximum compression
  });

  // Pipe archive to the stream
  archive.pipe(stream);

  // Add data.json (complete backup data)
  archive.append(JSON.stringify(data, null, 2), { name: "data.json" });

  // Add metadata.json (summary info)
  const metadata = {
    version: data.version,
    exportedAt: data.exportedAt,
    company: {
      name: data.company.name,
      slug: data.company.slug,
      plan: data.company.plan,
    },
    stats: data.stats,
  };
  archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });

  // Add summary.txt (human-readable summary)
  const summary = generateSummary(data);
  archive.append(summary, { name: "summary.txt" });

  // Finalize the archive (this will trigger 'end' event on the stream)
  await archive.finalize();

  return stream;
}

function generateSummary(data: CompanyBackupData): string {
  const { company, stats } = data;

  return `
OrbitFlow CRM - Company Backup
================================

Company Information:
--------------------
Name: ${company.name}
Slug: ${company.slug}
Plan: ${company.plan}
Status: ${company.isActive ? "Active" : "Inactive"}
Max Users: ${company.maxUsers}
Max Quizzes: ${company.maxQuizzes}

Backup Details:
---------------
Version: ${data.version}
Exported At: ${new Date(data.exportedAt).toLocaleString()}

Statistics:
-----------
Total Users: ${stats.userCount} (${stats.activeUserCount} active)
Total Leads: ${stats.leadCount}
Total Deals: ${stats.dealCount}
Total Quizzes: ${stats.quizCount}
Total Revenue: $${stats.totalRevenue.toLocaleString()}

Data Included:
--------------
- Company profile and settings
- Users (excluding passwords)
- Leads with notes
- Deals with notes
- Commissions
- Quizzes with questions and submissions (up to 1,000 per quiz)
- Audit logs (up to 10,000 most recent)

Security Notes:
---------------
- User passwords are NOT included in this backup
- Store this file securely as it contains sensitive business data
- Only company owners can generate backups

For support or questions, visit: https://orbitflow.com/support
`.trim();
}
