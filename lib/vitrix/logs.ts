import path from "node:path";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import type { VitrixLogFile } from "@/lib/vitrix/types";

const LOGS_DIR = path.join(process.cwd(), "storage", "logs");
const RESOLVED_DIR = path.join(LOGS_DIR, "resolved");

function isSafeLogName(file: string) {
  return (
    file === path.basename(file) &&
    file.endsWith(".log") &&
    !file.includes("..")
  );
}

async function ensureLogDirs() {
  await mkdir(LOGS_DIR, { recursive: true });
  await mkdir(RESOLVED_DIR, { recursive: true });
}

function formatLogArg(arg: unknown) {
  if (typeof arg === "string") return arg;
  if (arg instanceof Error) return arg.stack ?? arg.message;
  try {
    return JSON.stringify(arg, undefined, 2);
  } catch {
    return String(arg);
  }
}

function safeLogFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const random = Math.random().toString(36).slice(2, 8);
  return `vitrix-error-${stamp}-${random}.log`;
}

async function writeVitrixLogFile(
  message: string,
  meta: { level?: string; route?: string } = {},
) {
  await ensureLogDirs();
  const filename = safeLogFileName();
  const target = path.join(LOGS_DIR, filename);
  const headerLines = [
    `timestamp: ${new Date().toISOString()}`,
    `level: ${meta.level ?? "error"}`,
    meta.route ? `route: ${meta.route}` : undefined,
    "",
  ].filter(Boolean);

  await writeFile(target, `${headerLines.join("\n")}${message}\n`, "utf8");
  return filename;
}

export function initVitrixErrorLogger() {
  const globalAny = globalThis as unknown as {
    __vitrixErrorLoggerInitialized?: boolean;
    __vitrixOriginalConsoleError?: typeof console.error;
  };
  if (globalAny.__vitrixErrorLoggerInitialized) return;
  globalAny.__vitrixErrorLoggerInitialized = true;
  globalAny.__vitrixOriginalConsoleError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    globalAny.__vitrixOriginalConsoleError?.(...args);
    const message = args.map(formatLogArg).join(" ");
    void writeVitrixLogFile(message, { level: "error" }).catch((err) => {
      globalAny.__vitrixOriginalConsoleError?.(
        "Failed to write Vitrix error log:",
        err,
      );
    });
  };
}

async function listFromDir(
  dir: string,
  status: VitrixLogFile["status"],
): Promise<VitrixLogFile[]> {
  await ensureLogDirs();
  const entries = await readdir(dir, { withFileTypes: true });
  const logs = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && isSafeLogName(entry.name))
      .map(async (entry) => {
        const info = await stat(path.join(dir, entry.name));
        return {
          name: entry.name,
          size: info.size,
          modified_at: info.mtime.toISOString(),
          status,
        };
      }),
  );

  return logs.sort(
    (a, b) =>
      new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime(),
  );
}

export async function listVitrixLogs() {
  const [open, resolved] = await Promise.all([
    listFromDir(LOGS_DIR, "open"),
    listFromDir(RESOLVED_DIR, "resolved"),
  ]);
  return { open, resolved, all: [...open, ...resolved] };
}

export async function writeVitrixLog(
  message: string,
  meta: { level?: string; route?: string } = {},
) {
  return writeVitrixLogFile(message, meta);
}

export async function logVitrixError(error: unknown, route?: string) {
  if (error instanceof Error) {
    return writeVitrixLogFile(error.stack ?? error.message, {
      level: "error",
      route,
    });
  }

  return writeVitrixLogFile(formatLogArg(error), {
    level: "error",
    route,
  });
}

export async function readVitrixLog(
  file: string,
  status: VitrixLogFile["status"] = "open",
) {
  if (!isSafeLogName(file)) {
    throw new Error("Nome log non valido.");
  }

  await ensureLogDirs();
  const dir = status === "resolved" ? RESOLVED_DIR : LOGS_DIR;
  const content = await readFile(path.join(dir, file), "utf8");
  return content.slice(0, 200_000);
}

export async function resolveVitrixLog(file: string) {
  if (!isSafeLogName(file)) {
    throw new Error("Nome log non valido.");
  }

  await ensureLogDirs();
  const source = path.join(LOGS_DIR, file);
  const parsed = path.parse(file);
  let targetName = file;
  let target = path.join(RESOLVED_DIR, targetName);

  try {
    await stat(target);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    targetName = `${parsed.name}-${stamp}${parsed.ext}`;
    target = path.join(RESOLVED_DIR, targetName);
  } catch {
    // Target does not exist.
  }

  await rename(source, target);
  return { name: targetName, status: "resolved" as const };
}
