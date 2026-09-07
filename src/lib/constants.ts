export const MAX_BODY_LENGTH = 2000;
export const MAX_NICK_LENGTH = 32;
export const DEFAULT_NICK = "anon";

/** How many messages the board keeps on screen. */
export const FEED_LIMIT = 200;

/** Minimum gap between two posts from the same IP. */
export const RATE_LIMIT_WINDOW_MS = 5_000;

/** How often the client asks the relay for new traffic. */
export const POLL_INTERVAL_MS = 4_000;
