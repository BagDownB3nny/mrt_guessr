# Pre-Deployment Checklist

Run this before shipping to production.

## Automated checks
- [ ] `CI=true npm run build` passes in `frontend/`
- [ ] `CI=true npm run test:unit` passes in `frontend/`
- [ ] Tutorial flow unit tests pass before every push

## Manual browser QA
- [ ] Open the game in an incognito / private window to trigger tutorial flow
- [ ] Play through and finish the tutorial
- [ ] During tutorial, verify all tutorial flows work correctly
  - [ ] intro / welcome
  - [ ] first correct → congrats
  - [ ] first correct → score card
  - [ ] first correct → next-station card
  - [ ] 1 wrong event
  - [ ] 2 wrong event
  - [ ] 3 wrong event including pan/reveal
- [ ] Play Quickplay with no errors
- [ ] Play Speedrun and verify end card appears
- [ ] In Speedrun, verify leaderboard opens and works correctly
- [ ] Play Daily Challenge and verify a daily challenge exists

## Suggested test order
1. Incognito tutorial run
2. Quickplay smoke test
3. Speedrun smoke test + leaderboard
4. Daily challenge smoke test
