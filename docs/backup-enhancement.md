# Backup System Enhancement

## Overview
Enhanced the backup functionality to allow Super Admin to download backups for any company (not just their own).

## Changes Made

### 1. Modified API Route (`/src/app/api/backup/export/route.ts`)
- Added support for optional `companyId` query parameter
- **Super Admin**: Can backup any company by passing `?companyId=xxx`
- **Owner**: Can only backup their own company (companyId parameter is ignored)
- Added dual logging:
  - System log entry when super admin backs up another company
  - Audit log entry for the target company showing who downloaded the backup

### 2. Enhanced Company Details Sheet (`/src/components/super-admin/company-details-sheet.tsx`)
- Added new **Backup** tab (5th tab after Notes)
- Provides download button for the specific company
- Shows security warning about backup contents
- Lists what's included in the backup
- Uses the enhanced API route with company-specific companyId

## Usage

### For Super Admin
1. Navigate to `/super-admin/companies`
2. Click on any company to open the details sheet
3. Go to the **Backup** tab
4. Click **Download Backup** button
5. ZIP file will be downloaded: `orbitflow-backup-{slug}-{date}.zip`

### For Owners
- Owners continue to use `/settings/backup` page for their own company backup
- The enhanced API route ensures owners can only backup their own company

## Security Features
- Role validation: Only SUPER_ADMIN and OWNER roles can download backups
- Company validation: Ensures target company exists before generating backup
- Audit trail: All backup downloads are logged with:
  - Who downloaded it (user ID)
  - Which company was backed up
  - When it was downloaded
  - For super admin cross-company backups: logged to SystemLog

## Backup Contents
Each backup includes:
- Company profile and settings
- Users (passwords excluded for security)
- Leads with notes
- Deals with notes
- Commissions
- Quizzes with configurations
- Audit logs (last 10,000 entries)

## File Format
- ZIP archive with compression
- Contains 3 files:
  - `data.json` - Full data export
  - `metadata.json` - Export metadata
  - `summary.txt` - Human-readable summary

## Future Enhancements (Not Yet Implemented)
- Restore functionality (upload and restore from backup ZIP)
- Scheduled automated backups
- Backup retention policies
- Incremental backups
