import type { BoardMessage } from "@/lib/messages";
import { formatTimestamp } from "@/lib/format";

type Props = {
  message: BoardMessage;
  /** After hydration the timestamp switches from UTC to the reader's zone. */
  localTime: boolean;
  isNew: boolean;
};

export function MessageLine({ message, localTime, isNew }: Props) {
  return (
    <p className={isNew ? "log-line is-new" : "log-line"}>
      <time dateTime={message.createdAt}>
        [{formatTimestamp(message.createdAt, localTime)}]
      </time>{" "}
      <span className="nick">&lt;{message.nick}&gt;</span> {message.body}
    </p>
  );
}
