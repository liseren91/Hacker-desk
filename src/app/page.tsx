import { AsciiHeader } from "@/components/AsciiHeader";
import { Board } from "@/components/Board";
import { listMessages } from "@/lib/messages";

// The board is live traffic — never prerender or cache it.
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  // Server-rendered so a reload shows the log immediately, before any polling.
  const messages = await listMessages();

  return (
    <main className="screen">
      <AsciiHeader />
      <Board initialMessages={messages} />
    </main>
  );
}
