function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Renders "2026-09-07 14:32:07".
 *
 * The server has no idea what timezone the reader is in, so it formats in UTC
 * and the client re-renders in local time once hydrated — same string shape,
 * no hydration mismatch.
 */
export function formatTimestamp(iso: string, local: boolean): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "0000-00-00 00:00:00";

  const [year, month, day, hours, minutes, seconds] = local
    ? [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
      ]
    : [
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
      ];

  return (
    `${year}-${pad(month)}-${pad(day)} ` +
    `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  );
}
