export type TutorialHighlightTarget =
  | "station-card"
  | "lives"
  | "hints"
  | "score"
  | "correct-station"
  | "center"
  | "clicked-station";

export type TutorialCardPlacement = "below" | "side" | "center";

export type TutorialHighlightRequest = {
  target: TutorialHighlightTarget;
  stationName?: string;
  dimmed?: boolean;
  cardText: string;
  cardPlacement?: TutorialCardPlacement;
  continueable?: boolean;
};

export function resolveTutorialTargetElement(target: TutorialHighlightTarget, stationName?: string): HTMLElement | null {
  if (target === "clicked-station" && stationName) {
    return document.getElementById(`${stationName.replaceAll(" ", "_")}_Button`) as HTMLElement | null;
  }
  return document.querySelector(`[data-tutorial-target="${target}"]`) as HTMLElement | null;
}

export function measureTutorialTarget(target: TutorialHighlightTarget, stationName?: string): DOMRect | null {
  const el = resolveTutorialTargetElement(target, stationName);
  return el ? el.getBoundingClientRect() : null;
}
