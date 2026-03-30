# Pre-Push Checklist — MRT Guessr

Run these before every push. Especially required after touching:
- `MrtMapController.tsx`
- `MrtMap.module.css`
- `Game.module.css`
- Any component that adds touch/pointer listeners
- `react-zoom-pan-pinch` version bumps

---

## 1. Build must pass

```bash
cd frontend && npm run build
```

❌ No TypeScript errors  
❌ No compile failures  
⚠️ The existing CRA/babel warning about `@babel/plugin-proposal-private-property-in-object` is pre-existing and can be ignored

---

## 2. Automated interaction tests

Requires the dev server running on port 3001:

```bash
# Terminal 1
cd frontend && PORT=3001 npm start

# Terminal 2
node frontend/src/tests/mapInteraction.test.js
```

All 5 checks must pass:

| # | Check | Why it matters |
|---|-------|---------------|
| 1 | Touch-action chain clean | Any `auto` or `manipulation` between a station element and the wrapper lets iOS intercept the gesture before the zoom library sees it. `touch-action` does NOT cascade through SVG — must be explicitly set. |
| 2 | lastTouch cleared in capture phase | `react-zoom-pan-pinch` 3.6.1 bug: treats a 2nd touchstart within 200ms as a double-tap and skips the handler entirely. For a fast pinch, finger 2 always arrives within 200ms. Our capture-phase listener clears `lastTouch` so the guard is bypassed. |
| 3 | No touch listeners on stations | Even a `passive: true` touchstart listener on a station SVG element is enough for iOS Safari to route that finger's "ownership" to that node. Once a finger is owned by a deep SVG child, iOS won't merge it with a second finger into a pinch for the parent `TransformWrapper`. |
| 4 | Stations have click listener | After removing touch listeners, click must still work for station selection. |
| 5 | react-transform-component touch-action | The inner content div around the SVG must have `touch-action: none` (set via `contentStyle` on `TransformComponent`). |

---

## 3. Manual smoke test on phone

After deploying to Vercel:

### Pan
- [ ] Single finger drag pans the map smoothly
- [ ] Panning does NOT accidentally trigger a station click

### Pinch (fast)
- [ ] Both fingers land on empty space simultaneously → pinch works
- [ ] Both fingers land on a station simultaneously → pinch works

### Pinch (slow)
- [ ] First finger on empty space, then second finger → pinch works
- [ ] First finger on a station, then second finger on empty space → pinch works

### Station tap
- [ ] Tapping a station registers the guess
- [ ] Panning over a station does NOT register a guess

### Reveal on 3 wrong guesses
- [ ] After 3 wrong guesses, map pans to center the correct station
- [ ] Highlight circle appears after pan finishes
- [ ] No crash (`n.state.scale` error previously)

### Restart
- [ ] Restart button resets score, tries, and station labels on the map

---

## 4. Key architectural decisions (don't undo these)

| Decision | Reason |
|----------|--------|
| `touch-action: none` on every SVG element (set inline via `addStyleToStationsAndText`) | CSS `touch-action` does not cascade through SVG — must be inline on each node |
| No `touchstart`/`touchmove` on station elements | iOS assigns "finger ownership" to the deepest element with a touch listener. Owning a station prevents that finger merging into a pinch |
| Container listener uses `capture: true` | Fires before the library's bubble-phase handler so we can patch `lastTouch` first |
| `lastTouch = null` on `touches.length >= 2` | Bypasses rzpp 3.6.1 double-tap guard that silently drops fast pinch events |
| `e.preventDefault()` on `touches.length >= 2` | Blocks iOS native page-level pinch-to-zoom from intercepting the gesture |
| `contentStyle={{ touchAction: 'none' }}` on `TransformComponent` | The react-transform-component div defaults to `touch-action: auto` which leaks gestures |
| `GameContainer` is `touch-action: none` | Was previously `manipulation` which overrides all descendants |
