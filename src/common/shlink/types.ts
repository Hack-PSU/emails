// Type definitions for Shlink API responses
// Based on the internal types from @shlinkio/shlink-js-sdk

export interface ShlinkVisitsSummary {
  total: number;
  nonBots: number;
  bots: number;
}

export interface ShlinkShortUrl {
  shortCode: string;
  domain?: string | null;
  shortUrl: string;
  longUrl: string;
  dateCreated: string;
  visitsSummary: ShlinkVisitsSummary;
  meta: {
    validSince?: string | null;
    validUntil?: string | null;
    maxVisits?: number | null;
  };
  tags: string[];
  title?: string | null;
  crawlable?: boolean;
  forwardQuery?: boolean;
  hasRedirectRules?: boolean;
  // Legacy field for compatibility
  visitsCount?: number;
}

export interface ShlinkPaginator {
  currentPage: number;
  pagesCount: number;
  totalItems: number;
}

export interface ShlinkShortUrlsList {
  data: ShlinkShortUrl[];
  pagination: ShlinkPaginator;
}
