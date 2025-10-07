import { XMLParser } from 'fast-xml-parser';
import { ParsedDmarcReport, DmarcRecord } from './types';

export class DmarcParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  /**
   * Parse DMARC XML report using fast-xml-parser
   */
  async parseReport(
    xmlContent: string,
    emailId: string
  ): Promise<ParsedDmarcReport | null> {
    try {
      const parsed = this.xmlParser.parse(xmlContent);

      // Navigate to the feedback root - try multiple possible paths
      let feedback = parsed.feedback || parsed['?xml']?.feedback || parsed;

      // Some reports wrap everything differently
      if (!feedback.report_metadata && parsed.feedback) {
        feedback = parsed.feedback;
      }

      if (!feedback.report_metadata) {
        console.error('Invalid DMARC report structure - no report_metadata found');
        console.error('Available keys:', Object.keys(feedback || parsed).join(', '));
        return null;
      }

      // Transform the parsed data to our format
      const records: DmarcRecord[] = [];

      if (feedback.record) {
        const recordArray = Array.isArray(feedback.record)
          ? feedback.record
          : [feedback.record];

        for (const record of recordArray) {
          const dkimResult = record.auth_results?.dkim;
          const spfResult = record.auth_results?.spf;

          // Handle arrays for DKIM/SPF results (take first one)
          const dkimData = Array.isArray(dkimResult) ? dkimResult[0] : dkimResult;
          const spfData = Array.isArray(spfResult) ? spfResult[0] : spfResult;

          records.push({
            row: {
              source_ip: record.row?.source_ip || '',
              count: parseInt(record.row?.count || '1', 10),
              policy_evaluated: {
                disposition: record.row?.policy_evaluated?.disposition || 'none',
                dkim: record.row?.policy_evaluated?.dkim || 'fail',
                spf: record.row?.policy_evaluated?.spf || 'fail',
              },
            },
            identifiers: {
              header_from: record.identifiers?.header_from || '',
            },
            auth_results: {
              dkim: dkimData
                ? {
                    domain: dkimData.domain || '',
                    result: dkimData.result || 'fail',
                    selector: dkimData.selector,
                  }
                : undefined,
              spf: spfData
                ? {
                    domain: spfData.domain || '',
                    result: spfData.result || 'fail',
                    scope: spfData.scope,
                  }
                : undefined,
            },
          });
        }
      }

      const reportId =
        feedback.report_metadata.report_id || `report-${Date.now()}`;

      return {
        id: reportId,
        reportMetadata: {
          org_name: feedback.report_metadata.org_name || 'Unknown',
          email: feedback.report_metadata.email || '',
          report_id: reportId,
          date_range: {
            begin: parseInt(
              feedback.report_metadata.date_range?.begin || '0',
              10
            ),
            end: parseInt(feedback.report_metadata.date_range?.end || '0', 10),
          },
        },
        policyPublished: {
          domain: feedback.policy_published?.domain || '',
          adkim: feedback.policy_published?.adkim,
          aspf: feedback.policy_published?.aspf,
          p: feedback.policy_published?.p || 'none',
          sp: feedback.policy_published?.sp,
          pct: feedback.policy_published?.pct
            ? parseInt(feedback.policy_published.pct, 10)
            : undefined,
        },
        records,
        processedAt: new Date(),
        emailId,
      };
    } catch (error) {
      console.error('Error parsing DMARC report:', error);
      return null;
    }
  }

  /**
   * Validate if content is a valid DMARC report
   */
  isValidDmarcReport(xmlContent: string): boolean {
    try {
      // Check for basic XML structure
      if (!xmlContent || xmlContent.trim().length === 0) {
        return false;
      }

      // DMARC reports can have variations, but should contain these key elements
      const hasFeedback = xmlContent.includes('<feedback') || xmlContent.includes('<?xml');
      const hasMetadata = xmlContent.includes('report_metadata') || xmlContent.includes('org_name');
      const hasPolicy = xmlContent.includes('policy_published') || xmlContent.includes('<record');

      // More lenient validation - just need XML structure with report elements
      return hasFeedback && (hasMetadata || hasPolicy);
    } catch {
      return false;
    }
  }
}
