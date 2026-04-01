import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Generate next 5-day batch of daily challenges every 5 days at midnight SGT (16:00 UTC)
crons.interval(
  "generate daily challenge batch",
  { hours: 24 * 5 },
  api.generateBatch.generateNextBatch,
  {}
);

export default crons;
