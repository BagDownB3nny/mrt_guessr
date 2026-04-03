export const TUTORIAL_EVENTS_COOKIE = "mrt_guessr_tutorial_events";
export const TUTORIAL_COOKIE_DAYS = 365;
export const TUTORIAL_COMPLETED_EVENT = "tutorial_completed";

export function readTutorialEventsCookie(): Record<string, boolean> {
  const raw = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${TUTORIAL_EVENTS_COOKIE}=`));
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw.slice(TUTORIAL_EVENTS_COOKIE.length + 1)));
  } catch {
    return {};
  }
}

export function writeTutorialEventsCookie(events: Record<string, boolean>): void {
  const expires = new Date(Date.now() + TUTORIAL_COOKIE_DAYS * 86400000).toUTCString();
  document.cookie = `${TUTORIAL_EVENTS_COOKIE}=${encodeURIComponent(JSON.stringify(events))}; expires=${expires}; path=/; SameSite=Lax`;
}

export function markTutorialEventSeen(event: string): Record<string, boolean> {
  const prev = readTutorialEventsCookie();
  const next = { ...prev, [event]: true };
  writeTutorialEventsCookie(next);
  return next;
}

export function markAllTutorialEventsComplete(): Record<string, boolean> {
  const next = {
    intro_find_station: true,
    found_score: true,
    found_next_station: true,
    wrong_once_lives: true,
    wrong_twice_hints: true,
    wrong_thrice_reveal: true,
    [TUTORIAL_COMPLETED_EVENT]: true,
  };
  writeTutorialEventsCookie(next);
  return next;
}

export function hasCompletedTutorial(): boolean {
  const events = readTutorialEventsCookie();
  return events[TUTORIAL_COMPLETED_EVENT] === true;
}
