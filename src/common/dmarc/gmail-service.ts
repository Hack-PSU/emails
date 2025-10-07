import Imap from 'imap';
import { simpleParser } from 'mailparser';
import AdmZip from 'adm-zip';
import * as zlib from 'zlib';
import { GmailConfig } from './types';

export class GmailService {
  private config: GmailConfig;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  /**
   * Fetch emails from Gmail with specific label
   */
  async fetchEmailsWithLabel(): Promise<
    Array<{
      id: string;
      subject: string;
      from: string;
      date: Date;
      attachments: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
      }>;
    }>
  > {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.email,
        password: this.config.appPassword,
        host: this.config.imapHost,
        port: this.config.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      const emails: Array<{
        id: string;
        subject: string;
        from: string;
        date: Date;
        attachments: Array<{
          filename: string;
          content: Buffer;
          contentType: string;
        }>;
      }> = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Search for emails with DMARC label
          imap.search(
            [['X-GM-LABELS', this.config.label]],
            (err, results) => {
              if (err) {
                reject(err);
                return;
              }

              if (!results || results.length === 0) {
                imap.end();
                resolve([]);
                return;
              }

              const fetch = imap.fetch(results, {
                bodies: '',
                struct: true,
              });

              fetch.on('message', (msg) => {
                msg.on('body', (stream) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  simpleParser(stream as any).then((parsed) => {
                    if (!parsed) {
                      console.error('Error parsing email: no parsed data');
                      return;
                    }

                    const attachments = parsed.attachments.map((att) => ({
                      filename: att.filename || 'unknown',
                      content: att.content,
                      contentType: att.contentType,
                    }));

                    emails.push({
                      id: parsed.messageId || `email-${Date.now()}`,
                      subject: parsed.subject || '',
                      from: parsed.from?.text || '',
                      date: parsed.date || new Date(),
                      attachments,
                    });
                  }).catch((err: Error) => {
                    console.error('Error parsing email:', err);
                  });
                });
              });

              fetch.once('error', (err) => {
                reject(err);
              });

              fetch.once('end', () => {
                imap.end();
              });
            }
          );
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.once('end', () => {
        resolve(emails);
      });

      imap.connect();
    });
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
