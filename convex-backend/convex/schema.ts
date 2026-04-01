import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Speedrun leaderboard
  scores: defineTable({
    username: v.string(),
    score_ms: v.number(),
  }).index("by_score", ["score_ms"]),

  // Static station metadata (seeded once)
  stations: defineTable({
    name: v.string(),
    lines: v.array(v.string()),   // ["NSL", "EWL", ...]
    zone: v.string(),             // "North" | "South" | "East" | "West" | "Central"
    opened: v.number(),           // year
    interchange: v.boolean(),
  }).index("by_name", ["name"])
    .index("by_zone", ["zone"])
    .index("by_opened", ["opened"]),

  // Daily challenge queue (one row per day)
  challenge_queue: defineTable({
    date: v.string(),       // "YYYY-MM-DD" SGT
    stations: v.array(v.string()),  // 5 station names
    batch_id: v.string(),   // groups 10 challenges generated together
  }).index("by_date", ["date"])
    .index("by_batch", ["batch_id"]),
});
