/**
 * Runs before `prisma migrate deploy`.
 *
 * Two failure modes are worth catching early: a missing DATABASE_URL (Prisma
 * reports it as a schema validation dump, which reads like a code bug rather
 * than a missing setting) and a database file that is about to be written
 * somewhere that does not survive a redeploy.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SETUP_HINT = `
  Railway  -> pick the service -> Variables -> New Variable
             DATABASE_URL = file:/data/board.db
             (and mount the volume at exactly /data)

  Local    -> cp .env.example .env       # DATABASE_URL="file:./dev.db"

  See README.md, "Деплой на Railway".`;

// A bare node process does not read .env — the Prisma CLI and Next.js each do
// it themselves. Read it here too, but let a real environment variable win, so
// precedence matches what Prisma will do a moment later.
const fromEnvironment = process.env.DATABASE_URL;
try {
  process.loadEnvFile();
} catch {
  // No .env file: normal in production, where the platform injects the vars.
}

const url = fromEnvironment ?? process.env.DATABASE_URL;

if (!url) {
  console.error("\n[board] DATABASE_URL is not set — refusing to start.\n");
  console.error(SETUP_HINT);
  process.exit(1);
}

if (!url.startsWith("file:")) {
  console.error(`\n[board] DATABASE_URL must be a SQLite file: URL, got "${url}".\n`);
  console.error(SETUP_HINT);
  process.exit(1);
}

const filePath = url.slice("file:".length);

// Relative paths are resolved by Prisma against prisma/schema.prisma and are
// only ever used for local development, so there is nothing to verify.
if (!filePath.startsWith("/")) {
  process.exit(0);
}

const directory = dirname(resolve(filePath));

if (!existsSync(directory)) {
  // The volume mount creates this; if it is missing the mount is missing too.
  mkdirSync(directory, { recursive: true });
  console.warn(`[board] created ${directory} — it was not there already.`);
}

/** True when `directory` is its own mount point rather than part of the image. */
function isMountPoint(target) {
  try {
    return readFileSync("/proc/mounts", "utf8")
      .split("\n")
      .some((line) => line.split(" ")[1] === target);
  } catch {
    // No /proc (macOS, Windows) — nothing to assert about volumes there.
    return true;
  }
}

if (!isMountPoint(directory)) {
  console.warn(
    `\n[board] WARNING: ${directory} is not a mounted volume.\n` +
      `[board] The board will run, but every message is lost on the next deploy.\n` +
      `[board] Attach a volume with mount path ${directory} in the Railway service.\n`,
  );
}

console.log(`[board] database file: ${filePath}`);
