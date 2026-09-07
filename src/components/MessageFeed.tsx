"use client";

import { useEffect, useRef, useState } from "react";

import { MessageLine } from "@/components/MessageLine";
import type { BoardMessage } from "@/lib/messages";

/** How close to the bottom counts as "following the log". */
const STICK_THRESHOLD_PX = 64;

type Props = {
  messages: BoardMessage[];
};

export function MessageFeed({ messages }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const seenIds = useRef<Set<number> | null>(null);
  const [localTime, setLocalTime] = useState(false);

  // Timestamps render in UTC on the server; swap to the reader's zone once
  // the DOM is live so hydration still matches.
  useEffect(() => setLocalTime(true), []);

  // Messages already on screen at first paint are not "new" — only later
  // arrivals get the decode animation.
  if (seenIds.current === null) {
    seenIds.current = new Set(messages.map((message) => message.id));
  }
  const previouslySeen = seenIds.current;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !stickToBottom.current) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const seen = seenIds.current;
    if (!seen) return;
    for (const message of messages) seen.add(message.id);
  }, [messages]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    stickToBottom.current =
      scrollHeight - scrollTop - clientHeight <= STICK_THRESHOLD_PX;
  }

  return (
    <div
      className="panel feed"
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Message log"
    >
      {messages.length === 0 ? (
        <p className="feed-empty">
          // NO TRAFFIC ON THIS NODE. BE THE FIRST GHOST.{" "}
          <span className="cursor">&#9608;</span>
        </p>
      ) : (
        messages.map((message) => (
          <MessageLine
            key={message.id}
            message={message}
            localTime={localTime}
            isNew={!previouslySeen.has(message.id)}
          />
        ))
      )}
    </div>
  );
}
