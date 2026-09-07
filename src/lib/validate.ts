import {
  DEFAULT_NICK,
  MAX_BODY_LENGTH,
  MAX_NICK_LENGTH,
} from "@/lib/constants";
import { escapeHtml, stripControlChars } from "@/lib/sanitize";

export type ValidationResult =
  | { ok: true; nick: string; body: string }
  | { ok: false; error: string };

/** Collapses CRLF and lone CR so stored bodies only ever contain "\n". */
function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

/** Caps runs of blank lines so one post cannot flood the whole viewport. */
function collapseBlankLines(input: string): string {
  return input.replace(/\n{3,}/g, "\n\n");
}

/**
 * Turns raw request input into a row that is safe to store: trimmed, stripped
 * of control characters, length-checked and HTML-escaped.
 */
export function validateSubmission(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "MALFORMED PAYLOAD" };
  }

  const { nick: rawNick, body: rawBody } = input as Record<string, unknown>;

  if (rawNick !== undefined && typeof rawNick !== "string") {
    return { ok: false, error: "HANDLE MUST BE TEXT" };
  }
  if (typeof rawBody !== "string") {
    return { ok: false, error: "MESSAGE MUST BE TEXT" };
  }

  const nick = stripControlChars(rawNick ?? "").replace(/\s+/g, " ").trim();
  const body = collapseBlankLines(
    stripControlChars(normalizeNewlines(rawBody)).trim(),
  );

  if (body.length === 0) {
    return { ok: false, error: "EMPTY TRANSMISSION" };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return { ok: false, error: `MESSAGE EXCEEDS ${MAX_BODY_LENGTH} CHARS` };
  }
  if (nick.length > MAX_NICK_LENGTH) {
    return { ok: false, error: `HANDLE EXCEEDS ${MAX_NICK_LENGTH} CHARS` };
  }

  return {
    ok: true,
    nick: escapeHtml(nick || DEFAULT_NICK),
    body: escapeHtml(body),
  };
}
