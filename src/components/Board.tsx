"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ComposeForm } from "@/components/ComposeForm";
import { MessageFeed } from "@/components/MessageFeed";
import { StatusLine, type ConnectionState } from "@/components/StatusLine";
import { FEED_LIMIT, POLL_INTERVAL_MS } from "@/lib/constants";
import type { BoardMessage } from "@/lib/messages";

/** How long an error stays on the status line before the link "recovers". */
const ERROR_TTL_MS = 6_000;

type LinkState = "idle" | "receiving" | "lost";

type Props = {
  initialMessages: BoardMessage[];
};

export function Board({ initialMessages }: Props) {
  const [messages, setMessages] = useState<BoardMessage[]>(initialMessages);
  const [link, setLink] = useState<LinkState>("idle");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cursor for incremental polling: only traffic newer than this is fetched.
  const lastIdRef = useRef(initialMessages.at(-1)?.id ?? 0);
  const pollInFlight = useRef(false);

  const merge = useCallback((incoming: BoardMessage[]) => {
    for (const message of incoming) {
      if (message.id > lastIdRef.current) lastIdRef.current = message.id;
    }

    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const fresh = incoming.filter((message) => !known.has(message.id));
      if (fresh.length === 0) return current;

      // A message posted from this tab can arrive before older polled ones,
      // so keep the log ordered by id rather than by arrival.
      const next = [...current, ...fresh].sort((a, b) => a.id - b.id);
      return next.length > FEED_LIMIT ? next.slice(next.length - FEED_LIMIT) : next;
    });
  }, []);

  const poll = useCallback(async () => {
    if (pollInFlight.current) return;
    pollInFlight.current = true;
    setLink("receiving");

    try {
      const response = await fetch(`/api/messages?after=${lastIdRef.current}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`relay responded ${response.status}`);

      const data = (await response.json()) as { messages: BoardMessage[] };
      merge(data.messages);
      setLink("idle");
    } catch {
      setLink("lost");
    } finally {
      pollInFlight.current = false;
    }
  }, [merge]);

  useEffect(() => {
    // A hidden tab does not need the traffic; catch up the moment it returns.
    const tick = () => {
      if (!document.hidden) void poll();
    };

    const interval = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [poll]);

  useEffect(() => {
    if (error === null) return;
    const timer = window.setTimeout(() => setError(null), ERROR_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [error]);

  const submit = useCallback(
    async (nick: string, body: string): Promise<boolean> => {
      setSending(true);
      setError(null);

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ nick, body }),
        });

        const data = (await response.json().catch(() => null)) as
          | { message?: BoardMessage; error?: string }
          | null;

        if (!response.ok) {
          setError(data?.error ?? `RELAY REFUSED (${response.status})`);
          return false;
        }

        if (data?.message) merge([data.message]);
        setLink("idle");
        return true;
      } catch {
        setError("TRANSMIT FAILED :: NO CARRIER");
        return false;
      } finally {
        setSending(false);
      }
    },
    [merge],
  );

  const state: ConnectionState =
    link === "lost" ? "lost" : sending ? "sending" : link;

  return (
    <>
      <MessageFeed messages={messages} />
      <StatusLine state={state} error={error} messageCount={messages.length} />
      <ComposeForm onSubmit={submit} sending={sending} />
    </>
  );
}
