import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

// Generate next 5-day batch of daily challenges every 5 days
crons.interval(
  "generate daily challenge batch",
  { hours: 24 * 5 },
  api.generateBatch.generateNextBatch,
  {}
);

// Clean up scores daily at midnight SGT (16:00 UTC) — retain only top 100
crons.daily(
  "cleanup scores",
  { hourUTC: 16, minuteUTC: 0 },
  internal.cleanup.cleanupScores,
  {}
);

export default crons;
