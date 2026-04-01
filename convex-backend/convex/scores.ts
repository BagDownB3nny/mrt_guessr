import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_USERNAME_LEN = 32;
const TOP_LIMIT = 10;

/** Submit a speedrun score. */
export const submit = mutation({
  args: {
    username: v.string(),
    score_ms: v.number(),
  },
  handler: async (ctx, { username, score_ms }) => {
    const trimmed = username.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_USERNAME_LEN) {
      throw new Error(`Username must be 1–${MAX_USERNAME_LEN} characters`);
    }
    if (!Number.isInteger(score_ms) || score_ms < 0) {
      throw new Error("score_ms must be a non-negative integer");
    }
    const id = await ctx.db.insert("scores", {
      username: trimmed,
      score_ms,
    });
    return { id };
  },
});

/** Get the top N speedrun scores (lowest ms first). */
export const getTop = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = TOP_LIMIT }) => {
    const rows = await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("asc")
      .take(Math.min(limit, 100));

    return rows.map((r) => ({
      id: r._id,
      username: r.username,
      score_ms: r.score_ms,
      created_at: new Date(r._creationTime).toISOString(),
    }));
  },
});

/** Check if a time qualifies for the leaderboard (beats any top-10 entry or board has < 10). */
export const qualifies = query({
  args: { score_ms: v.number() },
  handler: async (ctx, { score_ms }) => {
    const top = await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("asc")
      .take(10);
    if (top.length < 10) return true;
    return score_ms < top[top.length - 1].score_ms;
  },
});
