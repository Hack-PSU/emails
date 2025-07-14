export interface SendGridMetrics {
  clicks: number;
  unique_clicks: number;
  opens: number;
  unique_opens: number;
  blocks: number;
  bounce_drops: number;
  bounces: number;
  deferred: number;
  delivered: number;
  invalid_emails: number;
  processed: number;
  requests: number;
  spam_report_drops: number;
  spam_reports: number;
  unsubscribe_drops: number;
  unsubscribes: number;
}

export interface SendGridStats {
  date: string;
  stats: Array<{
    metrics: SendGridMetrics;
  }>;
}

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  aggregatedBy: "day" | "week" | "month";
  limit: number;
  offset: number;
}

export interface AdvancedStat {
  date: string;
  stats: {
    name: string;
    type: string;
    metrics: Record<string, number>;
  }[];
}

export interface AggregatedAdvancedStat {
  name: string;
  metrics: Record<string, number>;
}
