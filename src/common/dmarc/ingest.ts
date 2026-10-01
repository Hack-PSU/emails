import { GmailService } from './gmail-service';
import { DmarcParser } from './parser';
import { DmarcFirestoreService } from './firestore';
import { GmailConfig, ParsedDmarcReport } from './types';

const firestoreService = new DmarcFirestoreService();
const parser = new DmarcParser();

/** Emails downloaded per batch: small enough that one batch fits well inside a request. */
export const DMARC_BATCH_SIZE = 50;

export interface DmarcBatchResult {
  totalEmails: number;
  processed: number;
  skipped: number;
  errors: number;
  /** Candidate emails still waiting after this batch. */
  remaining: number;
  hasMore: boolean;
}

/**
 * Ingest the next batch of DMARC emails after the stored cursor, then advance it.
 *
 * The cursor moves past every email in the batch, including ones whose reports
 * failed to parse, so one malformed email cannot stall ingestion forever.
 */
export async function processNextBatch(config: GmailConfig): Promise<DmarcBatchResult> {
  const gmailService = new GmailService(config);
  const cursor = await firestoreService.getCursor();
  const batch = await gmailService.fetchNewEmails(cursor, DMARC_BATCH_SIZE);

  const reports: ParsedDmarcReport[] = [];
  let errors = 0;

  for (const email of batch.emails) {
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
        errors++;
        console.error(`Failed to parse report from: ${attachment.filename}`);
        continue;
      }

      reports.push(parsedReport);
    }
  }

  const { saved, skipped } = await firestoreService.saveNewReports(reports);
  await firestoreService.saveCursor({ uidValidity: batch.uidValidity, lastUid: batch.lastUid });

  return {
    totalEmails: batch.emails.length,
    processed: saved,
    skipped,
    errors,
    remaining: batch.remaining,
    hasMore: batch.remaining > 0,
  };
}

/** node-imap tags login failures with source "authentication". */
export function isGmailAuthError(error: unknown): boolean {
  return (error as { source?: string } | null)?.source === 'authentication';
}
