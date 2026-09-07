const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const UNESCAPES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * Escapes HTML before anything is persisted, so the stored row is inert no
 * matter which client reads it later (React, a raw dump, an RSS feed...).
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/**
 * Inverse of {@link escapeHtml}. React escapes again on render, so decoding
 * here only changes what the reader sees, never how it is interpreted.
 */
export function unescapeHtml(input: string): string {
  return input.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => UNESCAPES[entity]);
}

/**
 * Drops control characters (newline and tab excepted) that would otherwise let
 * a message garble the terminal-style log.
 */
export function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
}
