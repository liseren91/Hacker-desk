export type ConnectionState = "idle" | "receiving" | "sending" | "lost";

const LABELS: Record<ConnectionState, string> = {
  idle: "// LINK STABLE",
  receiving: "...RECEIVING PACKETS",
  sending: "...TRANSMITTING",
  lost: "!! CONNECTION LOST :: RETRYING",
};

type Props = {
  state: ConnectionState;
  error: string | null;
  messageCount: number;
};

export function StatusLine({ state, error, messageCount }: Props) {
  const tone = state === "lost" || error ? "alert" : state === "idle" ? "live" : "dim";

  return (
    <div className="status" data-tone={tone} role="status" aria-live="polite">
      <span>{error ? `!! ${error}` : LABELS[state]}</span>
      <span>{messageCount} PACKETS BUFFERED</span>
    </div>
  );
}
