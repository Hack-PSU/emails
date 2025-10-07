import { NextRequest, NextResponse } from 'next/server';
import { DmarcConfigService } from '@/common/dmarc/config-service';

const configService = new DmarcConfigService();

// GET: Retrieve Gmail configuration
export async function GET() {
  try {
    const isConfigured = configService.isConfigured();

    if (!isConfigured) {
      return NextResponse.json(
        { error: 'No Gmail configuration found. Please set DMARC_GMAIL_EMAIL and DMARC_GMAIL_APP_PASSWORD environment variables.' },
        { status: 404 }
      );
    }

    const config = configService.getGmailConfig();

    // Don't send the full app password in response
    return NextResponse.json({
      email: config?.email || '',
      label: config?.label || 'DMARC',
      isConfigured: true,
    });
  } catch (error) {
    console.error('Error fetching Gmail config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// POST: Configuration info (env variables should be set directly)
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: false,
      message: 'Configuration is managed through environment variables. Please set DMARC_GMAIL_EMAIL, DMARC_GMAIL_APP_PASSWORD, and DMARC_GMAIL_LABEL in your .env file.',
    }, { status: 400 });
  } catch (error) {
    console.error('Error saving Gmail config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
