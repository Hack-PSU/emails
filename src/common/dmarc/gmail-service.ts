import Imap from 'imap';
import { simpleParser } from 'mailparser';
import AdmZip from 'adm-zip';
import * as zlib from 'zlib';
import { FetchedEmail, GmailBatch, GmailConfig, GmailCursor } from './types';

export class GmailService {
  private config: GmailConfig;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  /**
   * Fetch the next batch of labelled emails newer than the cursor.
   *
   * Only messages with a UID above `afterUid` are downloaded, so a run costs
   * the new mail rather than the whole label. UIDs are only comparable within
   * one UIDVALIDITY; if the mailbox's differs from the cursor's, the cursor is
   * stale and the scan restarts from the beginning.
   */
  async fetchNewEmails(cursor: GmailCursor | null, limit: number): Promise<GmailBatch> {
    const imap = new Imap({
      user: this.config.email,
      password: this.config.appPassword,
      host: this.config.imapHost,
      port: this.config.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    await new Promise<void>((resolve, reject) => {
      imap.once('ready', () => resolve());
      imap.once('error', reject);
      imap.connect();
    });

    try {
      const box = await new Promise<Imap.Box>((resolve, reject) => {
        imap.openBox('INBOX', true, (err, box) => (err ? reject(err) : resolve(box)));
      });

      const uidValidity = box.uidvalidity;
      const afterUid = cursor && cursor.uidValidity === uidValidity ? cursor.lastUid : 0;

      const uids = await new Promise<number[]>((resolve, reject) => {
        imap.search(
          [['X-GM-LABELS', this.config.label], ['UID', `${afterUid + 1}:*`]],
          (err, results) => (err ? reject(err) : resolve(results ?? []))
        );
      });

      // `n:*` always matches the highest UID in the mailbox, even below n.
      const pending = uids.filter((uid) => uid > afterUid).sort((a, b) => a - b);
      const batch = pending.slice(0, limit);

      if (batch.length === 0) {
        return { emails: [], uidValidity, lastUid: afterUid, remaining: 0 };
      }

      const emails = await new Promise<FetchedEmail[]>((resolve, reject) => {
        const parses: Promise<FetchedEmail | null>[] = [];
        const fetch = imap.fetch(batch, { bodies: '', struct: true });

        fetch.on('message', (msg) => {
          let uid = 0;
          let body: Promise<Omit<FetchedEmail, 'uid'> | null> = Promise.resolve(null);

          msg.on('attributes', (attrs) => {
            uid = attrs.uid;
          });

          msg.on('body', (stream) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            body = simpleParser(stream as any)
              .then((parsed) => ({
                id: parsed.messageId || `email-${Date.now()}`,
                subject: parsed.subject || '',
                from: parsed.from?.text || '',
                date: parsed.date || new Date(),
                attachments: parsed.attachments.map((att) => ({
                  filename: att.filename || 'unknown',
                  content: att.content,
                  contentType: att.contentType,
                })),
              }))
              .catch((err: Error) => {
                console.error('Error parsing email:', err);
                return null;
              });
          });

          // Both attributes and body have been emitted by the time a message ends.
          parses.push(
            new Promise<void>((done) => msg.once('end', () => done())).then(async () => {
              const email = await body;
              return email && { ...email, uid };
            })
          );
        });

        fetch.once('error', reject);

        // Parsing outlives the fetch stream; wait for every message before returning.
        fetch.once('end', () => {
          Promise.all(parses).then(
            (results) => resolve(results.filter((e): e is FetchedEmail => e !== null)),
            reject
          );
        });
      });

      return {
        emails,
        uidValidity,
        lastUid: batch[batch.length - 1],
        remaining: pending.length - batch.length,
      };
    } finally {
      imap.end();
    }
  }

  /**
   * Extract XML from ZIP, GZIP, or plain XML attachments
   */
  extractXmlFromAttachment(
    attachment: Buffer,
    filename: string
  ): string | null {
    try {
      // Handle ZIP files
      if (filename.endsWith('.zip')) {
        const zip = new AdmZip(attachment);
        const zipEntries = zip.getEntries();

        for (const entry of zipEntries) {
          if (entry.entryName.endsWith('.xml')) {
            const xmlContent = entry.getData().toString('utf8');
            console.log(`Extracted XML from ZIP: ${entry.entryName} (${xmlContent.length} bytes)`);
            return xmlContent;
          }
        }
        console.warn(`No XML file found in ZIP: ${filename}`);
      }

      // Handle GZIP files (.gz and .xml.gz)
      if (filename.endsWith('.gz') || filename.endsWith('.xml.gz')) {
        const uncompressed = zlib.gunzipSync(attachment);
        const xmlContent = uncompressed.toString('utf8');
        console.log(`Extracted XML from GZIP: ${filename} (${xmlContent.length} bytes)`);
        return xmlContent;
      }

      // Handle plain XML
      if (filename.endsWith('.xml')) {
        const xmlContent = attachment.toString('utf8');
        console.log(`Read plain XML: ${filename} (${xmlContent.length} bytes)`);
        return xmlContent;
      }

      console.warn(`Unsupported file format: ${filename}`);
      return null;
    } catch (error) {
      console.error(`Error extracting XML from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Test connection to Gmail
   */
  async testConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.email,
        password: this.config.appPassword,
        host: this.config.imapHost,
        port: this.config.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once('ready', () => {
        imap.end();
        resolve(true);
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }
}
