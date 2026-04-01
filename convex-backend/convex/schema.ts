import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scores: defineTable({
    username: v.string(),
    score_ms: v.number(),
  }).index("by_score", ["score_ms"]),

  daily_challenge: defineTable({
    date: v.string(),       // "YYYY-MM-DD"
    station: v.string(),    // station name
  }).index("by_date", ["date"]),
});
