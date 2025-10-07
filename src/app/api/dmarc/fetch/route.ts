import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/common/dmarc/gmail-service';
import { DmarcParser } from '@/common/dmarc/parser';
import { DmarcFirestoreService } from '@/common/dmarc/firestore';
import { DmarcConfigService } from '@/common/dmarc/config-service';

const firestoreService = new DmarcFirestoreService();
const configService = new DmarcConfigService();
const parser = new DmarcParser();

// POST: Fetch and process DMARC reports from Gmail
export async function POST(request: NextRequest) {
  try {
    // Get Gmail config from environment
    const config = configService.getGmailConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Gmail configuration not found. Please set DMARC_GMAIL_EMAIL and DMARC_GMAIL_APP_PASSWORD environment variables.' },
        { status: 400 }
      );
    }

    // Initialize Gmail service
    const gmailService = new GmailService(config);

    // Test connection first
    try {
      await gmailService.testConnection();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to connect to Gmail. Please check your credentials.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 401 }
      );
    }

    // Fetch emails
    const emails = await gmailService.fetchEmailsWithLabel();

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each email
    for (const email of emails) {
      for (const attachment of email.attachments) {
        // Extract XML from attachment
        const xmlContent = gmailService.extractXmlFromAttachment(
          attachment.content,
          attachment.filename
        );

        if (!xmlContent) {
          console.log(`No XML found in attachment: ${attachment.filename}`);
          continue;
        }

        // Validate DMARC report
        if (!parser.isValidDmarcReport(xmlContent)) {
          console.log(`Invalid DMARC report in: ${attachment.filename}`);
          continue;
        }

        // Parse report
        const parsedReport = await parser.parseReport(xmlContent, email.id);

        if (!parsedReport) {
          errorCount++;
          console.error(`Failed to parse report from: ${attachment.filename}`);
          continue;
        }

        // Check if report already exists
        const exists = await firestoreService.reportExists(parsedReport.id);

        if (exists) {
          skippedCount++;
          console.log(`Report ${parsedReport.id} already exists, skipping`);
          continue;
        }

        // Save to Firestore
        await firestoreService.saveReport(parsedReport);
        processedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'DMARC reports processed successfully',
      stats: {
        totalEmails: emails.length,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('Error processing DMARC reports:', error);
    return NextResponse.json(
      {
        error: 'Failed to process DMARC reports',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
