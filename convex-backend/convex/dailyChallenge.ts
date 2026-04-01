/**
 * Daily Challenge — Phase 1
 *
 * getToday: returns today's 5 stations (SGT).
 * Returns null if no challenge is queued for today.
 */
import { query, mutation } from "./_generated/server";

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

/** Debug: list all challenges in the queue. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("challenge_queue").collect();
    return all.map(c => ({ 
      date: c.date, 
      stations: c.stations,
      stationCount: c.stations.length, 
      uniqueCount: new Set(c.stations).size,
      batch_id: c.batch_id 
    }));
  },
});

/** Admin: Delete challenges with empty stations. */
export const deleteEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("challenge_queue").collect();
    let deleted = 0;
    for (const challenge of all) {
      if (!challenge.stations || challenge.stations.length === 0) {
        await ctx.db.delete(challenge._id);
        deleted++;
      }
    }
    return { deleted };
  },
});
