/**
 * Stub for Convex generated API types.
 * Replace this file with the real generated output after running:
 *   cd convex-backend && npx convex dev
 * Then copy convex-backend/convex/_generated/ → frontend/src/convex/_generated/
 *
 * Until Darren deploys Convex, Daily Challenge will show "No challenge available".
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api: any = {
  dailyChallenge: {
    getToday: "dailyChallenge:getToday",
  },
  scores: {
    getTop:    "scores:getTop",
    submit:    "scores:submit",
    qualifies: "scores:qualifies",
  },
  generateBatch: {
    generateNextBatch: "generateBatch:generateNextBatch",
  },
  stationSeed: {
    seedStations:  "stationSeed:seedStations",
    countStations: "stationSeed:countStations",
  },
};
