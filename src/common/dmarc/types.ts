// DMARC Report Types

export interface DmarcRecord {
  row: {
    source_ip: string;
    count: number;
    policy_evaluated: {
      disposition: string;
      dkim: string;
      spf: string;
    };
  };
  identifiers: {
    header_from: string;
  };
  auth_results: {
    dkim?: {
      domain: string;
      result: string;
      selector?: string;
    };
    spf?: {
      domain: string;
      result: string;
      scope?: string;
    };
  };
}

export interface DmarcReportMetadata {
  org_name: string;
  email: string;
  report_id: string;
  date_range: {
    begin: number;
    end: number;
  };
}

export interface ParsedDmarcReport {
  id: string;
  reportMetadata: DmarcReportMetadata;
  policyPublished: {
    domain: string;
    adkim?: string;
    aspf?: string;
    p: string;
    sp?: string;
    pct?: number;
  };
  records: DmarcRecord[];
  processedAt: Date;
  emailId: string;
}

export interface DmarcReportStats {
  totalReports: number;
  totalMessages: number;
  compliantMessages: number;
  nonCompliantMessages: number;
  spfPassRate: number;
  dkimPassRate: number;
  dmarcPassRate: number;
  topFailedIPs: Array<{
    ip: string;
    count: number;
    country?: string;
  }>;
  dispositionBreakdown: {
    none: number;
    quarantine: number;
    reject: number;
  };
  timeline: Array<{
    date: string;
    compliant: number;
    nonCompliant: number;
  }>;
}

export interface GmailConfig {
  email: string;
  appPassword: string;
  imapHost: string;
  imapPort: number;
  label: string;
}
