import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "INTERNAL_ERROR";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode; errorId?: string };

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type LogContext = {
  source?: string;
  endpoint?: string;
  userId?: string;
  companyId?: string;
  metadata?: Record<string, JsonValue>;
};

// ─── AppError ───────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = "INTERNAL_ERROR",
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─── Log Functions ──────────────────────────────────────

export async function logError(
  error: unknown,
  context: LogContext = {}
): Promise<string | undefined> {
  const message =
    error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const errorId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    await prisma.systemLog.create({
      data: {
        level: "ERROR",
        message,
        stack: stack ?? null,
        source: context.source ?? "SERVER_ACTION",
        endpoint: context.endpoint ?? null,
        userId: context.userId ?? null,
        companyId: context.companyId ?? null,
        metadata: {
          ...context.metadata,
          errorId,
        },
      },
    });
  } catch (dbError) {
    // If the DB is down, fall back to console so we don't throw again
    console.error("[logger] Failed to write to SystemLog:", dbError);
    console.error("[logger] Original error:", message, stack);
  }

  return errorId;
}

export async function logInfo(
  message: string,
  context: LogContext = {}
): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        level: "INFO",
        message,
        source: context.source ?? "SERVER_ACTION",
        endpoint: context.endpoint ?? null,
        userId: context.userId ?? null,
        companyId: context.companyId ?? null,
        metadata: context.metadata ?? undefined,
      },
    });
  } catch (dbError) {
    console.error("[logger] Failed to write INFO log:", dbError);
  }
}

// ─── withErrorHandling wrapper ──────────────────────────

export async function withErrorHandling<T>(
  actionName: string,
  action: () => Promise<T>,
  ctx?: { userId?: string; companyId?: string }
): Promise<ActionResult<T>> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    const errorId = await logError(error, {
      endpoint: actionName,
      userId: ctx?.userId,
      companyId: ctx?.companyId,
    });

    // Only expose error message if it's an operational AppError
    if (error instanceof AppError && error.isOperational) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        errorId,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
      code: "INTERNAL_ERROR",
      errorId,
    };
  }
}
