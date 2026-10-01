import { NextResponse } from 'next/server';
import { DmarcConfigService } from '@/common/dmarc/config-service';
import { isGmailAuthError, processNextBatch } from '@/common/dmarc/ingest';

const configService = new DmarcConfigService();

// POST: Fetch and process the next batch of DMARC reports from Gmail
export async function POST() {
  try {
    // Get Gmail config from environment
    const config = configService.getGmailConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Gmail configuration not found. Please set DMARC_GMAIL_EMAIL and DMARC_GMAIL_APP_PASSWORD environment variables.' },
        { status: 400 }
      );
    }

    // Process one batch; the client calls again while hasMore is true.
    let stats;
    try {
      stats = await processNextBatch(config);
    } catch (error) {
      if (isGmailAuthError(error)) {
        return NextResponse.json(
          {
            error: 'Failed to connect to Gmail. Please check your credentials.',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 401 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'DMARC reports processed successfully',
      stats,
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
