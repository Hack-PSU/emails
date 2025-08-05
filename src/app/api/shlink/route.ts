import { NextRequest, NextResponse } from "next/server";
import { ShlinkApiClient } from "@shlinkio/shlink-js-sdk";
import { FetchHttpClient } from "@shlinkio/shlink-js-sdk/fetch";

interface ShlinkFilters {
  itemsPerPage: number;
  searchTerm?: string;
  tags?: string[];
  orderBy?: {
    field:
      | "dateCreated"
      | "shortCode"
      | "longUrl"
      | "title"
      | "visits"
      | "nonBotVisits";
    dir: "ASC" | "DESC";
  };
  page?: string;
}

interface CreateShortUrlPayload {
  longUrl: string;
  customSlug?: string;
  title?: string;
  tags?: string[];
  maxVisits?: number;
  validSince?: string;
  validUntil?: string;
}

const httpClient = new FetchHttpClient();

const shlinkClient = new ShlinkApiClient(httpClient, {
  baseUrl: process.env.SHLINK_BASE_URL || "https://go.hackpsu.org",
  apiKey: process.env.SHLINK_API_KEY || "",
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "list": {
        const searchTerm = searchParams.get("searchTerm");
        const tags = searchParams.get("tags")?.split(",").filter(Boolean);
        const orderByField = searchParams.get("orderBy");
        const orderByDir = searchParams.get("orderDir") as "ASC" | "DESC";
        const page = searchParams.get("page");
        const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "50");

        const validOrderByFields = [
          "dateCreated",
          "shortCode",
          "longUrl",
          "title",
          "visits",
          "nonBotVisits",
        ];

        const filters: ShlinkFilters = {
          itemsPerPage,
        };

        if (searchTerm) filters.searchTerm = searchTerm;
        if (tags && tags.length > 0) filters.tags = tags;
        if (
          orderByField &&
          orderByDir &&
          validOrderByFields.includes(orderByField)
        ) {
          filters.orderBy = {
            field: orderByField as
              | "dateCreated"
              | "shortCode"
              | "longUrl"
              | "title"
              | "visits"
              | "nonBotVisits",
            dir: orderByDir,
          };
        }
        if (page) filters.page = page;

        const result = await shlinkClient.listShortUrls(filters);
        return NextResponse.json(result);
      }

      case "get": {
        const shortCode = searchParams.get("shortCode");
        const domain = searchParams.get("domain");

        if (!shortCode) {
          return NextResponse.json(
            { error: "shortCode is required" },
            { status: 400 },
          );
        }

        const result = await shlinkClient.getShortUrl({ shortCode, domain });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Shlink API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const {
          longUrl,
          customSlug,
          title,
          tags,
          maxVisits,
          validSince,
          validUntil,
        } = body;

        if (!longUrl) {
          return NextResponse.json(
            { error: "longUrl is required" },
            { status: 400 },
          );
        }

        const payload: CreateShortUrlPayload = { longUrl };
        if (customSlug) payload.customSlug = customSlug;
        if (title) payload.title = title;
        if (tags) payload.tags = tags;
        if (maxVisits) payload.maxVisits = maxVisits;
        if (validSince) payload.validSince = validSince;
        if (validUntil) payload.validUntil = validUntil;

        const result = await shlinkClient.createShortUrl(payload);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Shlink API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { shortCode, domain, updates } = body;

    if (!shortCode) {
      return NextResponse.json(
        { error: "shortCode is required" },
        { status: 400 },
      );
    }

    const result = await shlinkClient.updateShortUrl(
      { shortCode, domain },
      updates,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Shlink API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shortCode = searchParams.get("shortCode");
    const domain = searchParams.get("domain");

    if (!shortCode) {
      return NextResponse.json(
        { error: "shortCode is required" },
        { status: 400 },
      );
    }

    await shlinkClient.deleteShortUrl({ shortCode, domain });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shlink API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
