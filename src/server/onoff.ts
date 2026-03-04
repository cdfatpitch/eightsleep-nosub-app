import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { obtainFreshAccessToken } from "./eight/auth";
import { turnOffSide, turnOnSide } from "./eight/eight";
import { type Token } from "./eight/types";

export type OnOffConfig = {
  off_time: string;
  on_time: string;
  timezone?: string;
};

const DEFAULT_CONFIG: OnOffConfig = {
  off_time: "07:00",
  on_time: "21:00",
  timezone: "UTC",
};

function configPath(): string {
  return (
    process.env.ONOFF_CONFIG_PATH ??
    path.join(process.cwd(), "config", "onoff-config.json")
  );
}

export function loadOnOffConfig(): OnOffConfig {
  try {
    const raw = fs.readFileSync(configPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<OnOffConfig>;
    const merged = {
      ...DEFAULT_CONFIG,
      ...parsed,
    };
    validateTime(merged.off_time);
    validateTime(merged.on_time);
    return merged;
  } catch (error) {
    console.warn("Falling back to default on/off config:", error);
    return DEFAULT_CONFIG;
  }
}

function validateTime(time: string) {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Invalid time format (expected HH:MM): ${time}`);
  }
}

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

function timeToDate(now: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const copy = new Date(now);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function localNow(config: OnOffConfig, base: Date): Date {
  return new Date(
    base.toLocaleString("en-US", { timeZone: config.timezone ?? "UTC" }),
  );
}

async function withFreshToken(userEmail: string, token: Token): Promise<Token> {
  if (Date.now() <= token.eightExpiresAtPosix) {
    return token;
  }
  const refreshed = await obtainFreshAccessToken(
    token.eightRefreshToken,
    token.eightUserId,
  );
  await db
    .update(users)
    .set({
      eightAccessToken: refreshed.eightAccessToken,
      eightRefreshToken: refreshed.eightRefreshToken,
      eightTokenExpiresAt: new Date(refreshed.eightExpiresAtPosix),
    })
    .where(eq(users.email, userEmail))
    .execute();
  return refreshed;
}

export async function runOnOffJob(options?: {
  action?: "on" | "off";
  now?: Date;
  toleranceMinutes?: number;
}): Promise<{ action: "on" | "off" | null; ranFor: number; localTime: string }> {
  const config = loadOnOffConfig();
  const current = localNow(config, options?.now ?? new Date());
  const toleranceMs = (options?.toleranceMinutes ?? 1) * 60 * 1000;

  const targetOff = timeToDate(current, config.off_time);
  const targetOn = timeToDate(current, config.on_time);

  let action = options?.action ?? null;
  if (!action) {
    if (Math.abs(current.getTime() - targetOff.getTime()) <= toleranceMs) {
      action = "off";
    } else if (Math.abs(current.getTime() - targetOn.getTime()) <= toleranceMs) {
      action = "on";
    }
  }

  if (!action) {
    return { action: null, ranFor: 0, localTime: formatTime(current) };
  }

  const allUsers = await db.select().from(users);
  let processed = 0;
  for (const user of allUsers) {
    try {
      const token: Token = {
        eightAccessToken: user.eightAccessToken,
        eightRefreshToken: user.eightRefreshToken,
        eightExpiresAtPosix: user.eightTokenExpiresAt.getTime(),
        eightUserId: user.eightUserId,
      };
      const fresh = await withFreshToken(user.email, token);
      if (action === "off") {
        await turnOffSide(fresh, user.eightUserId);
      } else {
        await turnOnSide(fresh, user.eightUserId);
      }
      processed += 1;
    } catch (error) {
      console.error(`Failed to run ${action} for ${user.email}:`, error);
    }
  }

  return { action, ranFor: processed, localTime: formatTime(current) };
}
