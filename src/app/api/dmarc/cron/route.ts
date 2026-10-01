import { NextRequest, NextResponse } from 'next/server';
import { DmarcFirestoreService } from '@/common/dmarc/firestore';
import { DmarcConfigService } from '@/common/dmarc/config-service';
import { processNextBatch } from '@/common/dmarc/ingest';

const firestoreService = new DmarcFirestoreService();
const configService = new DmarcConfigService();

/** Stop starting new batches after this long, well inside the request timeout. */
const CRON_TIME_BUDGET_MS = 4 * 60 * 1000;

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

    // Work through batches until caught up or out of time. Whatever is left
    // stays behind the cursor and is picked up on the next run.
    const startedAt = Date.now();
    const stats = { totalEmails: 0, processed: 0, skipped: 0, errors: 0, remaining: 0 };
    let hasMore = true;

    while (hasMore && Date.now() - startedAt < CRON_TIME_BUDGET_MS) {
      const batch = await processNextBatch(config);
      stats.totalEmails += batch.totalEmails;
      stats.processed += batch.processed;
      stats.skipped += batch.skipped;
      stats.errors += batch.errors;
      stats.remaining = batch.remaining;
      hasMore = batch.hasMore;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: { ...stats, hasMore },
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
