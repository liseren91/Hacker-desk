"use client";

import { useEffect, useRef, useState } from "react";

import { MAX_BODY_LENGTH, MAX_NICK_LENGTH } from "@/lib/constants";

const NICK_STORAGE_KEY = "chibanet.handle";

type Props = {
  /** Resolves true when the message was accepted, so the field can clear. */
  onSubmit: (nick: string, body: string) => Promise<boolean>;
  sending: boolean;
};

export function ComposeForm({ onSubmit, sending }: Props) {
  const [nick, setNick] = useState("");
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The handle is a convenience, not an identity — it never leaves the browser
  // until the author actually transmits something.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(NICK_STORAGE_KEY);
      if (stored) setNick(stored);
    } catch {
      // Private mode or blocked storage: the field just starts empty.
    }
  }, []);

  // Grow the command line with the message instead of scrolling inside it.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";

    // Only hand the field a scrollbar once it has actually hit its ceiling.
    // Comparing against clientHeight instead would fire on sub-pixel rounding.
    const maxHeight = Number.parseFloat(getComputedStyle(textarea).maxHeight);
    textarea.style.overflowY =
      Number.isFinite(maxHeight) && textarea.scrollHeight > maxHeight
        ? "auto"
        : "hidden";

    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [body]);

  const tooLong = body.length > MAX_BODY_LENGTH;
  const canSend = body.trim().length > 0 && !tooLong && !sending;

  async function send() {
    if (!canSend) return;

    const trimmedNick = nick.trim();
    try {
      window.localStorage.setItem(NICK_STORAGE_KEY, trimmedNick);
    } catch {
      // Nothing to do — remembering the handle is best-effort.
    }

    const accepted = await onSubmit(trimmedNick, body);
    if (accepted) {
      setBody("");
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter transmits; Shift+Enter (and IME composition) inserts a newline.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    void send();
  }

  return (
    <form
      className="panel composer"
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <div className="field">
        <label htmlFor="handle">handle:</label>
        <input
          id="handle"
          name="handle"
          value={nick}
          onChange={(event) => setNick(event.target.value)}
          maxLength={MAX_NICK_LENGTH}
          placeholder="anon"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="field">
        <label htmlFor="msg">msg:</label>
        {body.length === 0 && (
          <span className="cursor" aria-hidden="true">
            &#9608;
          </span>
        )}
        <textarea
          id="msg"
          name="msg"
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="type. enter transmits, shift+enter breaks the line."
          spellCheck={false}
        />
      </div>

      <div className="composer-bar">
        <span className="counter" data-over={tooLong}>
          {body.length}/{MAX_BODY_LENGTH}
        </span>
        <button className="transmit" type="submit" disabled={!canSend}>
          [ {sending ? "SENDING" : "TRANSMIT"} ]
        </button>
      </div>
    </form>
  );
}
