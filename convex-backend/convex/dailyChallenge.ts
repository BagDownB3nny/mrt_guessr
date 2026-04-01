import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Get today's daily challenge station (SGT). */
export const getToday = query({
  args: {},
  handler: async (ctx) => {
    const date = todaySGT();
    const challenge = await ctx.db
      .query("daily_challenge")
      .withIndex("by_date", (q) => q.eq("date", date))
      .unique();
    return challenge ? { date, station: challenge.station } : null;
  },
});

/** Admin: set the daily challenge for a given date. */
export const setChallenge = mutation({
  args: {
    date: v.string(),   // "YYYY-MM-DD"
    station: v.string(),
    adminSecret: v.string(),
  },
  handler: async (ctx, { date, station, adminSecret }) => {
    if (adminSecret !== process.env.ADMIN_SECRET) {
      throw new Error("Unauthorized");
    }
    // Upsert
    const existing = await ctx.db
      .query("daily_challenge")
      .withIndex("by_date", (q) => q.eq("date", date))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { station });
    } else {
      await ctx.db.insert("daily_challenge", { date, station });
    }
    return { date, station };
  },
});

function todaySGT(): string {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })
  )
    .toISOString()
    .slice(0, 10);
}
