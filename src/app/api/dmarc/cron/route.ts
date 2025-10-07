import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/common/dmarc/gmail-service';
import { DmarcParser } from '@/common/dmarc/parser';
import { DmarcFirestoreService } from '@/common/dmarc/firestore';
import { DmarcConfigService } from '@/common/dmarc/config-service';

const firestoreService = new DmarcFirestoreService();
const configService = new DmarcConfigService();
const parser = new DmarcParser();

/**
 * Automated DMARC report fetching endpoint
 * Can be called by external cron services like Vercel Cron or Google Cloud Scheduler
 *
 * Usage: POST /api/dmarc/cron
 * Headers: Authorization: Bearer <your-secret-token>
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (add a secret token in production)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN || 'your-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Gmail config from environment
    const config = configService.getGmailConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Gmail configuration not found. Please set environment variables.' },
        { status: 400 }
      );
    }

    // Initialize Gmail service
    const gmailService = new GmailService(config);

    // Fetch and process emails
    const emails = await gmailService.fetchEmailsWithLabel();

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const email of emails) {
      for (const attachment of email.attachments) {
        const xmlContent = gmailService.extractXmlFromAttachment(
          attachment.content,
          attachment.filename
        );

        if (!xmlContent || !parser.isValidDmarcReport(xmlContent)) {
          continue;
        }

        const parsedReport = await parser.parseReport(xmlContent, email.id);

        if (!parsedReport) {
          errorCount++;
          continue;
        }

        const exists = await firestoreService.reportExists(parsedReport.id);

        if (exists) {
          skippedCount++;
          continue;
        }

        await firestoreService.saveReport(parsedReport);
        processedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalEmails: emails.length,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('Error in DMARC cron job:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check cron status
export async function GET() {
  try {
    const count = await firestoreService.getReportCount();

    return NextResponse.json({
      status: 'active',
      totalReports: count,
      lastChecked: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
