import { FEED_LIMIT } from "@/lib/constants";

// ANSI-shadow block art, the house style of every BBS login screen worth
// dialing into. Kept as a raw string so no escape ever bends a column.
const LOGO = String.raw`
 ██████╗██╗  ██╗██╗██████╗  █████╗     ███╗   ██╗███████╗████████╗
██╔════╝██║  ██║██║██╔══██╗██╔══██╗    ████╗  ██║██╔════╝╚══██╔══╝
██║     ███████║██║██████╔╝███████║    ██╔██╗ ██║█████╗     ██║
██║     ██╔══██║██║██╔══██╗██╔══██║    ██║╚██╗██║██╔══╝     ██║
╚██████╗██║  ██║██║██████╔╝██║  ██║    ██║ ╚████║███████╗   ██║
 ╚═════╝╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═══╝╚══════╝   ╚═╝
`.replace(/^\n/, "");

export function AsciiHeader() {
  return (
    <header className="panel header">
      <pre className="logo" aria-label="CHIBA//NET">
        {LOGO}
      </pre>
      <div className="header-meta">
        <span>
          <strong>// SECURE NODE :: ANONYMOUS RELAY //</strong>
        </span>
        <span>NO LOGS · NO NAMES · LAST {FEED_LIMIT} PACKETS</span>
      </div>
    </header>
  );
}
