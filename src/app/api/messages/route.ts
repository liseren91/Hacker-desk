import { NextResponse } from "next/server";

import { RATE_LIMIT_WINDOW_MS } from "@/lib/constants";
import { createMessage, listMessages } from "@/lib/messages";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";
import { validateSubmission } from "@/lib/validate";

// The feed changes on every post, so it must never be cached or prerendered.
export const dynamic = "force-dynamic";

function parseAfter(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function GET(request: Request) {
  const afterId = parseAfter(new URL(request.url).searchParams.get("after"));

  try {
    const messages = await listMessages(afterId);
    return NextResponse.json({ messages }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[board] failed to read messages", error);
    return NextResponse.json({ error: "RELAY UNREACHABLE" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  const verdict = checkRateLimit(ip);

  if (!verdict.allowed) {
    const seconds = Math.ceil(verdict.retryAfterMs / 1000);
    return NextResponse.json(
      {
        error: `FLOOD CONTROL :: WAIT ${seconds}S`,
        retryAfterMs: verdict.retryAfterMs,
      },
      {
        status: 429,
        headers: { "retry-after": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "MALFORMED PAYLOAD" }, { status: 400 });
  }

  const result = validateSubmission(payload);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const message = await createMessage(result.nick, result.body);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[board] failed to store message", error);
    return NextResponse.json({ error: "WRITE FAILED" }, { status: 500 });
  }
}
