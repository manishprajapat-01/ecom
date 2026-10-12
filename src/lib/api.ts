import { NextResponse } from "next/server";
import { AuthError } from "./services/auth";

/**
 * Convert thrown errors from route handlers into consistent JSON responses.
 */
export function apiError(error: unknown, fallbackMessage = "Something went wrong", fallbackStatus = 500) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const err = error as { code?: string; message?: string; status?: number };

  // Prisma: database unreachable / not initialised
  if (err?.code === "P1001" || err?.code === "P1000" || err?.code === "P2021") {
    console.error("[api] database error:", err.message);
    return NextResponse.json(
      { error: "Database is not reachable. Check DATABASE_URL and run `npm run db:push`." },
      { status: 503 }
    );
  }

  if (err?.code === "P2025") {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  if (err?.code === "P2002") {
    return NextResponse.json({ error: "A record with the same unique value already exists" }, { status: 409 });
  }

  const status = typeof err?.status === "number" ? err.status : fallbackStatus;
  if (status >= 500) {
    console.error("[api]", error);
  }
  return NextResponse.json({ error: err?.message || fallbackMessage }, { status });
}

/**
 * Error with an HTTP status attached – thrown from services for expected failures
 * (validation, stock, ownership) so routes can return a precise status code.
 */
export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
