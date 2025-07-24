import { type NextRequest, NextResponse } from "next/server";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_BASE_URL = "https://api.sendgrid.com";

export async function GET(request: NextRequest) {
  if (!SENDGRID_API_KEY) {
    return NextResponse.json(
      { error: "SendGrid API key not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const aggregatedBy = searchParams.get("aggregated_by") || "day";
  const limit = searchParams.get("limit") || "100";
  const offset = searchParams.get("offset") || "0";

  if (!startDate) {
    return NextResponse.json(
      { error: "start_date is required" },
      { status: 400 },
    );
  }

  try {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      aggregated_by: aggregatedBy,
      limit,
      offset,
      ...(endDate && { end_date: endDate }),
    });

    const response = await fetch(
      `${SENDGRID_BASE_URL}/v3/stats?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("SendGrid API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SendGrid statistics" },
      { status: 500 },
    );
  }
}
