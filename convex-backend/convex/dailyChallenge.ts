/**
 * Daily Challenge — Phase 1
 *
 * getToday: returns today's 5 stations (SGT).
 * Returns null if no challenge is queued for today.
 */
import { query } from "./_generated/server";

/** Get today's daily challenge (SGT). */
export const getToday = query({
  args: {},
  handler: async (ctx) => {
    const date = todaySGT();
    const challenge = await ctx.db
      .query("challenge_queue")
      .withIndex("by_date", (q) => q.eq("date", date))
      .unique();
    if (!challenge) return null;
    return {
      date,
      stations: challenge.stations,
    };
  },
});

function todaySGT(): string {
  // Use SGT (UTC+8) for the date
  const now = new Date();
  const sgt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return sgt.toISOString().slice(0, 10);
}
