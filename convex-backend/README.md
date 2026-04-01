# MRT Guessr — Convex Backend

## Setup (Darren)

1. Create a free account at https://convex.dev
2. Install dependencies: `npm install`
3. Deploy: `npx convex deploy`
   - This will prompt you to log in and create a new project
   - Note the deployment URL it gives you (looks like `https://happy-animal-123.convex.cloud`)

4. Set the admin secret (for daily challenge management):
   ```
   npx convex env set ADMIN_SECRET your-secret-here
   ```

5. Send the deployment URL to Pigeon — I'll update `constants.json` in the frontend.

## Functions

### Scores
- `scores:submit` — mutation, `{ username, score_ms }` → submit a speedrun time
- `scores:getTop` — query, `{ limit? }` → top N scores sorted by time
- `scores:qualifies` — query, `{ score_ms }` → bool, does this time make the board?

### Daily Challenge
- `dailyChallenge:getToday` — query, `{}` → `{ date, station }` or null
- `dailyChallenge:setChallenge` — mutation (admin), `{ date, station, adminSecret }`

## Schema

```
scores:
  username  string
  score_ms  number (ms, lower = better)
  _creationTime auto

daily_challenge:
  date     string (YYYY-MM-DD, SGT)
  station  string
```
