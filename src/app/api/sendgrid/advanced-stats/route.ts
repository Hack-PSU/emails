import { type NextRequest, NextResponse } from "next/server";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_BASE_URL = "https://api.sendgrid.com";

async function fetchSendGridStats(
  endpoint: string,
  searchParams: URLSearchParams,
) {
  if (!SENDGRID_API_KEY) {
    throw new Error("SendGrid API key not configured");
  }

  const response = await fetch(
    `${SENDGRID_BASE_URL}/v3/${endpoint}/stats?${searchParams}`,
    {
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `SendGrid API error for ${endpoint}: ${response.status}`,
      errorBody,
    );
    throw new Error(`SendGrid API error: ${response.status}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'browsers', 'geo', 'mailbox_providers'
  searchParams.delete("type");

  if (!type || !["browsers", "geo", "mailbox_providers"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid stat type specified" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchSendGridStats(type, searchParams);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching SendGrid ${type} stats:`, error);
    return NextResponse.json(
      { error: `Failed to fetch SendGrid ${type} statistics` },
      { status: 500 },
    );
  }
}
