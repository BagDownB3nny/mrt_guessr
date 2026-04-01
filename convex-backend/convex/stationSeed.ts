/**
 * Admin mutation to seed the stations table.
 * Run once: npx convex run stationSeed:seedStations
 */
import { mutation, query } from "./_generated/server";
import { STATION_DATA } from "./stationData";

/** Seed all 145 stations. Safe to re-run — skips stations that already exist. */
export const seedStations = mutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    for (const s of STATION_DATA) {
      const existing = await ctx.db
        .query("stations")
        .withIndex("by_name", (q) => q.eq("name", s.name))
        .unique();
      if (!existing) {
        await ctx.db.insert("stations", s);
        inserted++;
      }
    }
    return { inserted, total: STATION_DATA.length };
  },
});

/** Quick count to verify seeding. */
export const countStations = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("stations").collect();
    return { count: all.length };
  },
});
