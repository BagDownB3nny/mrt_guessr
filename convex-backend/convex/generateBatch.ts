/**
 * Daily Challenge — Phase 2
 *
 * generateNextBatch: picks a random theme, queries matching stations,
 * samples 5, and queues 5 daily challenges starting from the day after
 * the last queued challenge.
 *
 * Called by cron every 5 days.
 */
import { mutation } from "./_generated/server";

const BATCH_SIZE = 5;           // number of days per batch
const STATIONS_PER_DAY = 5;     // stations per daily challenge

// ── Theme definitions ────────────────────────────────────────────────────────

type ThemeFilter = {
  type: "line" | "zone" | "era" | "interchange" | "non-interchange" | "new";
  value?: string;
};

const THEMES: ThemeFilter[] = [
  // By line
  { type: "line", value: "NSL" },
  { type: "line", value: "EWL" },
  { type: "line", value: "CCL" },
  { type: "line", value: "NEL" },
  { type: "line", value: "DTL" },
  { type: "line", value: "TEL" },
  // By zone
  { type: "zone", value: "North" },
  { type: "zone", value: "South" },
  { type: "zone", value: "East" },
  { type: "zone", value: "West" },
  { type: "zone", value: "Central" },
  // By era
  { type: "era", value: "classic" },    // opened < 1990
  { type: "era", value: "nineties" },   // 1990–1999
  { type: "era", value: "noughties" },  // 2000–2009
  { type: "era", value: "tens" },       // 2010–2019
  { type: "era", value: "modern" },     // 2020+
  // By property
  { type: "interchange" },              // interchange stations only
  { type: "non-interchange" },          // non-interchange only
  { type: "new" },                      // opened >= 2020
];

// ── Core logic ───────────────────────────────────────────────────────────────

export const generateNextBatch = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find the last queued date
    // Find the last queued date (no station dedup across batches)
    const lastQueued = await ctx.db
      .query("challenge_queue")
      .order("desc")
      .take(1);

    const lastDate = lastQueued.length > 0
      ? lastQueued[0].date
      : yesterdaySGT();

    // 2. Fetch all stations
    const allStations = await ctx.db.query("stations").collect();

    // 3. Each day in the batch needs its own theme + 5 stations
    const batchId = `batch_${Date.now()}`;
    const startDate = addDays(lastDate, 1);
    const allInserted: string[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      // Only avoid repeats within this batch
      const usedInBatch = new Set(allInserted);

      // Pick a random theme with enough unused candidates
      let candidatePool: string[] = [];
      let chosenTheme: ThemeFilter | null = null;

      const shuffledThemes = [...THEMES].sort(() => Math.random() - 0.5);
      for (const theme of shuffledThemes) {
        const matching = allStations
          .filter((s) => matchesTheme(s, theme))
          .map((s) => s.name)
          .filter((name) => !usedInBatch.has(name));

        if (matching.length >= STATIONS_PER_DAY) {
          candidatePool = matching;
          chosenTheme = theme;
          break;
        }
      }

      // Fallback: any unused station
      if (!chosenTheme || candidatePool.length < STATIONS_PER_DAY) {
        candidatePool = allStations
          .map((s) => s.name)
          .filter((name) => !usedInBatch.has(name));
      }

      const dayStations = sampleWithoutReplacement(candidatePool, STATIONS_PER_DAY);
      allInserted.push(...dayStations);

      const date = addDays(startDate, i);
      await ctx.db.insert("challenge_queue", {
        date,
        stations: dayStations,
        batch_id: batchId,
      });
    }

    return {
      batchId,
      startDate,
      endDate: addDays(startDate, BATCH_SIZE - 1),
      totalStations: allInserted.length,
    };
  },
});

// Admin alias for manual triggering
export const generateBatchAdmin = generateNextBatch;

// ── Theme matching ───────────────────────────────────────────────────────────

function matchesTheme(
  s: { lines: string[]; zone: string; opened: number; interchange: boolean },
  theme: ThemeFilter
): boolean {
  switch (theme.type) {
    case "line":
      return s.lines.includes(theme.value!);
    case "zone":
      return s.zone === theme.value;
    case "era":
      return matchesEra(s.opened, theme.value!);
    case "interchange":
      return s.interchange;
    case "non-interchange":
      return !s.interchange;
    case "new":
      return s.opened >= 2020;
    default:
      return false;
  }
}

function matchesEra(opened: number, era: string): boolean {
  switch (era) {
    case "classic":   return opened < 1990;
    case "nineties":  return opened >= 1990 && opened < 2000;
    case "noughties": return opened >= 2000 && opened < 2010;
    case "tens":      return opened >= 2010 && opened < 2020;
    case "modern":    return opened >= 2020;
    default: return false;
  }
}

function themeLabel(theme: ThemeFilter): string {
  switch (theme.type) {
    case "line":         return `${theme.value} stations`;
    case "zone":         return `${theme.value} zone stations`;
    case "interchange":  return "Interchange stations";
    case "non-interchange": return "Non-interchange stations";
    case "new":          return "Newest stations (2020+)";
    case "era":
      const labels: Record<string, string> = {
        classic: "Classic stations (pre-1990)",
        nineties: "1990s stations",
        noughties: "2000s stations",
        tens: "2010s stations",
        modern: "2020s stations",
      };
      return labels[theme.value!] ?? theme.value!;
    default: return "Mixed";
  }
}

// ── Utilities ────────────────────────────────────────────────────────────────

function sampleWithoutReplacement(pool: string[], n: number): string[] {
  const arr = [...pool];
  const result: string[] = [];
  for (let i = 0; i < n && arr.length > 0; i++) {
    const idx = Math.floor(Math.random() * arr.length);
    result.push(arr[idx]);
    arr.splice(idx, 1);
  }
  return result;
}

function todaySGT(): string {
  const now = new Date();
  const sgt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return sgt.toISOString().slice(0, 10);
}

function yesterdaySGT(): string {
  return addDays(todaySGT(), -1);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
