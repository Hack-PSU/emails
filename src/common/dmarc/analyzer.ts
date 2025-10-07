import { ParsedDmarcReport, DmarcReportStats, DmarcRecord } from './types';

export class DmarcAnalyzer {
  /**
   * Analyze multiple DMARC reports and generate statistics
   */
  analyzeReports(reports: ParsedDmarcReport[]): DmarcReportStats {
    let totalMessages = 0;
    let compliantMessages = 0;
    let nonCompliantMessages = 0;
    let spfPass = 0;
    let dkimPass = 0;
    let spfTotal = 0;
    let dkimTotal = 0;

    const ipCounts = new Map<string, number>();
    const dispositionCounts = {
      none: 0,
      quarantine: 0,
      reject: 0,
    };
    const timelineData = new Map<string, { compliant: number; nonCompliant: number }>();

    for (const report of reports) {
      for (const record of report.records) {
        const count = record.row.count;
        totalMessages += count;

        // Check compliance
        const isCompliant =
          record.row.policy_evaluated.dkim === 'pass' ||
          record.row.policy_evaluated.spf === 'pass';

        if (isCompliant) {
          compliantMessages += count;
        } else {
          nonCompliantMessages += count;
          // Track failed IPs
          const currentCount = ipCounts.get(record.row.source_ip) || 0;
          ipCounts.set(record.row.source_ip, currentCount + count);
        }

        // SPF stats
        if (record.auth_results.spf) {
          spfTotal += count;
          if (record.auth_results.spf.result === 'pass') {
            spfPass += count;
          }
        }

        // DKIM stats
        if (record.auth_results.dkim) {
          dkimTotal += count;
          if (record.auth_results.dkim.result === 'pass') {
            dkimPass += count;
          }
        }

        // Disposition stats
        const disposition = record.row.policy_evaluated.disposition;
        if (disposition in dispositionCounts) {
          dispositionCounts[disposition as keyof typeof dispositionCounts] += count;
        }

        // Timeline data
        const date = new Date(report.reportMetadata.date_range.begin * 1000)
          .toISOString()
          .split('T')[0];
        const existing = timelineData.get(date) || { compliant: 0, nonCompliant: 0 };
        if (isCompliant) {
          existing.compliant += count;
        } else {
          existing.nonCompliant += count;
        }
        timelineData.set(date, existing);
      }
    }

    // Get top failed IPs
    const topFailedIPs = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({
        ip,
        count,
        country: this.getCountryFromIP(ip),
      }));

    // Convert timeline to array and sort
    const timeline = Array.from(timelineData.entries())
      .map(([date, data]) => ({
        date,
        compliant: data.compliant,
        nonCompliant: data.nonCompliant,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalReports: reports.length,
      totalMessages,
      compliantMessages,
      nonCompliantMessages,
      spfPassRate: spfTotal > 0 ? (spfPass / spfTotal) * 100 : 0,
      dkimPassRate: dkimTotal > 0 ? (dkimPass / dkimTotal) * 100 : 0,
      dmarcPassRate: totalMessages > 0 ? (compliantMessages / totalMessages) * 100 : 0,
      topFailedIPs,
      dispositionBreakdown: dispositionCounts,
      timeline,
    };
  }

  /**
   * Get country code from IP address (simplified - would need IP geolocation service)
   */
  private getCountryFromIP(_ip: string): string | undefined {
    // This is a placeholder - in production, use an IP geolocation service
    // like ipapi.co, ip-api.com, or maxmind
    return undefined;
  }

  /**
   * Analyze a single report
   */
  analyzeSingleReport(report: ParsedDmarcReport): {
    totalMessages: number;
    passRate: number;
    failedRecords: DmarcRecord[];
  } {
    let totalMessages = 0;
    let passedMessages = 0;
    const failedRecords: DmarcRecord[] = [];

    for (const record of report.records) {
      totalMessages += record.row.count;

      const isPassed =
        record.row.policy_evaluated.dkim === 'pass' ||
        record.row.policy_evaluated.spf === 'pass';

      if (isPassed) {
        passedMessages += record.row.count;
      } else {
        failedRecords.push(record);
      }
    }

    return {
      totalMessages,
      passRate: totalMessages > 0 ? (passedMessages / totalMessages) * 100 : 0,
      failedRecords,
    };
  }

  /**
   * Get summary by source domain
   */
  getSourceDomainSummary(reports: ParsedDmarcReport[]): Array<{
    domain: string;
    totalMessages: number;
    dmarcPass: number;
    spfPass: number;
    dkimPass: number;
    passRate: number;
  }> {
    const domainStats = new Map<
      string,
      { total: number; passed: number; spfPass: number; dkimPass: number }
    >();

    for (const report of reports) {
      for (const record of report.records) {
        const domain = record.identifiers.header_from;
        const existing = domainStats.get(domain) || {
          total: 0,
          passed: 0,
          spfPass: 0,
          dkimPass: 0
        };

        existing.total += record.row.count;

        const isDmarcPassed =
          record.row.policy_evaluated.dkim === 'pass' ||
          record.row.policy_evaluated.spf === 'pass';

        if (isDmarcPassed) {
          existing.passed += record.row.count;
        }

        // Track SPF pass
        if (record.auth_results.spf?.result === 'pass') {
          existing.spfPass += record.row.count;
        }

        // Track DKIM pass
        if (record.auth_results.dkim?.result === 'pass') {
          existing.dkimPass += record.row.count;
        }

        domainStats.set(domain, existing);
      }
    }

    return Array.from(domainStats.entries())
      .map(([domain, stats]) => ({
        domain,
        totalMessages: stats.total,
        dmarcPass: stats.passed,
        spfPass: stats.spfPass,
        dkimPass: stats.dkimPass,
        passRate: (stats.passed / stats.total) * 100,
      }))
      .sort((a, b) => b.totalMessages - a.totalMessages);
  }
}
