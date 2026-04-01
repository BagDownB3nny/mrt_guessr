/**
 * DB cleanup — retains only the top 100 speedrun scores.
 * Called by cron daily.
 */
import { internalMutation } from "./_generated/server";

const TOP_SCORES_TO_KEEP = 100;

export const cleanupScores = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("asc")
      .collect();

    if (all.length <= TOP_SCORES_TO_KEEP) {
      return { deleted: 0, remaining: all.length };
    }

    const toDelete = all.slice(TOP_SCORES_TO_KEEP);
    for (const row of toDelete) {
      await ctx.db.delete(row._id);
    }

    return { deleted: toDelete.length, remaining: TOP_SCORES_TO_KEEP };
  },
});
