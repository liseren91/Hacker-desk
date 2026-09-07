import { FEED_LIMIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { unescapeHtml } from "@/lib/sanitize";

/** Wire/DOM shape of a message: plain text, ready to render. */
export type BoardMessage = {
  id: number;
  nick: string;
  body: string;
  createdAt: string;
};

type MessageRow = {
  id: number;
  nick: string;
  body: string;
  createdAt: Date;
};

/**
 * Rows are stored HTML-escaped; decode once here so React renders the author's
 * original characters (React re-escapes them on the way into the DOM).
 */
function toBoardMessage(row: MessageRow): BoardMessage {
  return {
    id: row.id,
    nick: unescapeHtml(row.nick),
    body: unescapeHtml(row.body),
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Latest messages in chronological order. With `afterId` this returns only the
 * traffic a polling client has not seen yet.
 */
export async function listMessages(afterId?: number): Promise<BoardMessage[]> {
  if (afterId !== undefined) {
    const rows = await prisma.message.findMany({
      where: { id: { gt: afterId } },
      orderBy: { id: "asc" },
      take: FEED_LIMIT,
    });
    return rows.map(toBoardMessage);
  }

  // Take the newest N, then flip back to oldest-first for the log view.
  const rows = await prisma.message.findMany({
    orderBy: { id: "desc" },
    take: FEED_LIMIT,
  });
  return rows.reverse().map(toBoardMessage);
}

export async function createMessage(
  nick: string,
  body: string,
): Promise<BoardMessage> {
  const row = await prisma.message.create({ data: { nick, body } });
  return toBoardMessage(row);
}
