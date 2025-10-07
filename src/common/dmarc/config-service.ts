import { GmailConfig } from './types';

/**
 * Service for managing DMARC configuration
 * Uses environment variables as the primary source
 */
export class DmarcConfigService {
  /**
   * Get Gmail configuration from environment variables
   */
  getGmailConfig(): GmailConfig | null {
    const email = process.env.DMARC_GMAIL_EMAIL;
    const appPassword = process.env.DMARC_GMAIL_APP_PASSWORD;
    const label = process.env.DMARC_GMAIL_LABEL || 'DMARC';

    if (!email || !appPassword) {
      return null;
    }

    return {
      email,
      appPassword,
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      label,
    };
  }

  /**
   * Validate Gmail configuration
   */
  isConfigured(): boolean {
    return !!process.env.DMARC_GMAIL_EMAIL && !!process.env.DMARC_GMAIL_APP_PASSWORD;
  }
}
