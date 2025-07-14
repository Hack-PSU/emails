import type { SendGridStats, SendGridMetrics } from "@/common/sendgrid/types";

export function aggregateMetrics(stats: SendGridStats[]): SendGridMetrics {
  const totals: SendGridMetrics = {
    clicks: 0,
    unique_clicks: 0,
    opens: 0,
    unique_opens: 0,
    blocks: 0,
    bounce_drops: 0,
    bounces: 0,
    deferred: 0,
    delivered: 0,
    invalid_emails: 0,
    processed: 0,
    requests: 0,
    spam_report_drops: 0,
    spam_reports: 0,
    unsubscribe_drops: 0,
    unsubscribes: 0,
  };

  stats.forEach((stat) => {
    stat.stats.forEach((s) => {
      Object.keys(totals).forEach((key) => {
        totals[key as keyof SendGridMetrics] +=
          s.metrics[key as keyof SendGridMetrics] || 0;
      });
    });
  });

  return totals;
}

export function calculateRates(metrics: SendGridMetrics) {
  const deliveryRate =
    metrics.requests > 0 ? (metrics.delivered / metrics.requests) * 100 : 0;
  const openRate =
    metrics.delivered > 0
      ? (metrics.unique_opens / metrics.delivered) * 100
      : 0;
  const clickRate =
    metrics.delivered > 0
      ? (metrics.unique_clicks / metrics.delivered) * 100
      : 0;
  const bounceRate =
    metrics.requests > 0 ? (metrics.bounces / metrics.requests) * 100 : 0;
  const spamRate =
    metrics.requests > 0 ? (metrics.spam_reports / metrics.requests) * 100 : 0;
  const unsubscribeRate =
    metrics.delivered > 0
      ? (metrics.unsubscribes / metrics.delivered) * 100
      : 0;

  return {
    deliveryRate,
    openRate,
    clickRate,
    bounceRate,
    spamRate,
    unsubscribeRate,
  };
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatPercentage(num: number): string {
  return `${num.toFixed(2)}%`;
}
