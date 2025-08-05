import type {
  ShlinkShortUrl,
  ShlinkPaginator,
  ShlinkShortUrlsList,
} from "./types";

export interface ShortUrlCreatePayload {
  longUrl: string;
  customSlug?: string;
  title?: string;
  tags?: string[];
  maxVisits?: number;
  validSince?: string;
  validUntil?: string;
}

export interface ShortUrlFilters {
  searchTerm?: string;
  tags?: string[];
  orderBy?: {
    field: "longUrl" | "shortCode" | "dateCreated" | "title" | "visits";
    dir: "ASC" | "DESC";
  };
  page?: string;
  itemsPerPage?: number;
}

export type ShortUrlListResponse = ShlinkShortUrlsList;

export class ShlinkService {
  static async listShortUrls(
    filters?: ShortUrlFilters,
  ): Promise<ShortUrlListResponse> {
    try {
      const params = new URLSearchParams({ action: "list" });

      if (filters?.searchTerm) params.append("searchTerm", filters.searchTerm);
      if (filters?.tags?.length) params.append("tags", filters.tags.join(","));
      if (filters?.orderBy) {
        params.append("orderBy", filters.orderBy.field);
        params.append("orderDir", filters.orderBy.dir);
      }
      if (filters?.page) params.append("page", filters.page);
      if (filters?.itemsPerPage)
        params.append("itemsPerPage", filters.itemsPerPage.toString());

      const response = await fetch(`/api/shlink?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch short URLs");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to list short URLs:", error);
      throw new Error("Failed to fetch short URLs");
    }
  }

  static async createShortUrl(
    payload: ShortUrlCreatePayload,
  ): Promise<ShlinkShortUrl> {
    try {
      const response = await fetch("/api/shlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...payload,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create short URL");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to create short URL:", error);
      throw new Error("Failed to create short URL");
    }
  }

  static async deleteShortUrl(
    shortCode: string,
    domain?: string,
  ): Promise<void> {
    try {
      const params = new URLSearchParams({ shortCode });
      if (domain) params.append("domain", domain);

      const response = await fetch(`/api/shlink?${params}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete short URL");
      }
    } catch (error) {
      console.error("Failed to delete short URL:", error);
      throw new Error("Failed to delete short URL");
    }
  }

  static async getShortUrl(
    shortCode: string,
    domain?: string,
  ): Promise<ShlinkShortUrl> {
    try {
      const params = new URLSearchParams({ action: "get", shortCode });
      if (domain) params.append("domain", domain);

      const response = await fetch(`/api/shlink?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get short URL");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get short URL:", error);
      throw new Error("Failed to get short URL");
    }
  }

  static async editShortUrl(
    shortCode: string,
    updates: Partial<ShortUrlCreatePayload>,
    domain?: string,
  ): Promise<ShlinkShortUrl> {
    try {
      const response = await fetch("/api/shlink", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shortCode,
          domain,
          updates,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit short URL");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to edit short URL:", error);
      throw new Error("Failed to edit short URL");
    }
  }
}

export { ShlinkService as default };
