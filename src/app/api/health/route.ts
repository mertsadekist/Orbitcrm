import { NextResponse } from "next/server";

/**
 * Health check endpoint used by Coolify's deployment healthcheck.
 * Returns 200 OK when the server is running.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
