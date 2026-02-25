import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, stack, url, componentStack } = body as {
      message?: string;
      stack?: string;
      url?: string;
      componentStack?: string;
    };

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const fullStack = [stack, componentStack].filter(Boolean).join("\n\n");

    const errorId = await logError(
      { message, stack: fullStack || undefined } as Error,
      {
        source: "CLIENT",
        endpoint: url ?? undefined,
        metadata: { url: url ?? null, componentStack: !!componentStack },
      }
    );

    return NextResponse.json({ logged: true, errorId });
  } catch {
    return NextResponse.json(
      { error: "Failed to log error" },
      { status: 500 }
    );
  }
}
