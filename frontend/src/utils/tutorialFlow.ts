import config from "../config/constants.json";

export type TutorialEventKey =
  | "intro_find_station"
  | "correct_first"
  | "wrong_once_lives"
  | "wrong_twice_hints"
  | "wrong_thrice_reveal";

export type TutorialHighlightTarget = "station-card" | "lives" | "hints" | "score" | "correct-station" | "center";

export type TutorialCard = {
  target: TutorialHighlightTarget;
  text: string;
  continueable?: boolean;
};

const tutorialText = (config as any).tutorial;

export function buildTutorialCards(event: TutorialEventKey, ctx: { station: string; found: number; total: number; triesLeft?: number }): TutorialCard[] {
  switch (event) {
    case "intro_find_station":
      return [{ target: "station-card", text: tutorialText.findStation.replace("{station}", ctx.station) }];
    case "correct_first":
      return [
        { target: "center", text: tutorialText.congrats.replace("{station}", ctx.station) },
        { target: "score", text: tutorialText.score.replace("{found}", String(ctx.found)).replace("{total}", String(ctx.total)) },
        { target: "station-card", text: tutorialText.nextStation.replace("{station}", ctx.station) },
      ];
    case "wrong_once_lives":
      return [{ target: "lives", text: tutorialText.lives.replace("{station}", ctx.station).replace("{triesLeft}", String(ctx.triesLeft ?? 2)) }];
    case "wrong_twice_hints":
      return [{ target: "hints", text: tutorialText.hints }];
    case "wrong_thrice_reveal":
      return [{ target: "correct-station", text: tutorialText.reveal.replaceAll("{station}", ctx.station), continueable: false }];
    default:
      return [];
  }
}

export function shouldTriggerTutorialEvent(event: TutorialEventKey, seen: Record<string, boolean>): boolean {
  return !seen[event];
}
