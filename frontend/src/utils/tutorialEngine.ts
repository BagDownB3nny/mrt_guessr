import config from "../config/constants.json";
import { TUTORIAL_COMPLETED_EVENT } from "./tutorial";
import { TutorialHighlightTarget } from "./tutorialHighlight";

export type TutorialEventKey =
  | "intro_find_station"
  | "correct_first"
  | "wrong_once_lives"
  | "wrong_twice_hints"
  | "wrong_thrice_reveal";

export type TutorialCard = {
  target: TutorialHighlightTarget;
  text: string;
  continueable?: boolean;
  dimmed?: boolean;
};

export type TutorialContext = {
  tutorialActive: boolean;
  isSpeedrun: boolean;
  currentStation: string;
  wrongCount: number;
  clickedStationsCount: number;
  totalStations: number;
  newlyCorrectStation: string;
  revealedStation: string | null;
};

export type TutorialEngineState = {
  activeEvent: TutorialEventKey | null;
  queue: TutorialCard[];
  visible: boolean;
  revealedStation: string | null;
  completionEventPending: boolean;
};

const tutorialText = (config as any).tutorial;
const revealDelayMs = (config.transitions as any).stationPanDelayMs + (config.transitions as any).revealCircleDelayMs;

export function createInitialTutorialEngineState(): TutorialEngineState {
  return {
    activeEvent: null,
    queue: [],
    visible: false,
    revealedStation: null,
    completionEventPending: false,
  };
}

export function getActiveCard(state: TutorialEngineState): TutorialCard | null {
  return state.queue[0] ?? null;
}

export function buildTutorialCards(event: TutorialEventKey, ctx: TutorialContext): TutorialCard[] {
  switch (event) {
    case "intro_find_station":
      return [{ target: "station-card", text: tutorialText.findStation.replace("{station}", ctx.currentStation), dimmed: true }];
    case "correct_first":
      return [
        { target: "center", text: tutorialText.congrats.replace("{station}", ctx.newlyCorrectStation), dimmed: false },
        { target: "score", text: tutorialText.score.replace("{found}", String(ctx.clickedStationsCount)).replace("{total}", String(ctx.totalStations)), dimmed: true },
        { target: "station-card", text: tutorialText.nextStation.replace("{station}", ctx.currentStation), dimmed: true },
      ];
    case "wrong_once_lives":
      return [{ target: "lives", text: tutorialText.lives.replace("{station}", ctx.currentStation).replace("{triesLeft}", String(2)), dimmed: true }];
    case "wrong_twice_hints":
      return [{ target: "hints", text: tutorialText.hints, dimmed: true }];
    case "wrong_thrice_reveal":
      return [{ target: "correct-station", text: tutorialText.reveal.replaceAll("{station}", ctx.currentStation), continueable: false, dimmed: false }];
    default:
      return [];
  }
}

export function shouldTriggerEvent(event: TutorialEventKey, ctx: TutorialContext, seen: Record<string, boolean>, state: TutorialEngineState): boolean {
  if (seen[event] || state.visible || state.queue.length > 0 || state.activeEvent) return false;

  switch (event) {
    case "intro_find_station":
      return ctx.tutorialActive && !!ctx.currentStation && ctx.wrongCount === 0;
    case "correct_first":
      return ctx.tutorialActive && !!ctx.newlyCorrectStation;
    case "wrong_once_lives":
      return ctx.tutorialActive && !ctx.isSpeedrun && !!ctx.currentStation && ctx.wrongCount === 1;
    case "wrong_twice_hints":
      return ctx.tutorialActive && !ctx.isSpeedrun && !!ctx.currentStation && ctx.wrongCount === 2;
    case "wrong_thrice_reveal":
      return ctx.tutorialActive && !ctx.isSpeedrun && !!ctx.currentStation && ctx.wrongCount >= 3;
    default:
      return false;
  }
}

export function enqueueEvent(state: TutorialEngineState, event: TutorialEventKey, cards: TutorialCard[], ctx: TutorialContext): TutorialEngineState {
  return {
    activeEvent: event,
    queue: cards,
    visible: cards.length > 0,
    revealedStation: event === "wrong_thrice_reveal" ? ctx.currentStation : state.revealedStation,
    completionEventPending: event === "correct_first",
  };
}

export function advanceQueue(state: TutorialEngineState): TutorialEngineState {
  const next = state.queue.slice(1);
  if (next.length === 0) {
    return {
      ...state,
      queue: [],
      visible: false,
      activeEvent: null,
      revealedStation: state.activeEvent === "wrong_thrice_reveal" ? null : state.revealedStation,
    };
  }
  return { ...state, queue: next, visible: true };
}

export function shouldDismissRevealOnCorrectTap(state: TutorialEngineState, clickedStation: string): boolean {
  return state.activeEvent === "wrong_thrice_reveal" && !!state.revealedStation && state.revealedStation === clickedStation;
}

export function getRevealDelayMs(): number {
  return revealDelayMs;
}

export function consumeCompletionPending(state: TutorialEngineState): [TutorialEngineState, typeof TUTORIAL_COMPLETED_EVENT | null] {
  if (!state.completionEventPending) return [state, null];
  return [{ ...state, completionEventPending: false }, TUTORIAL_COMPLETED_EVENT];
}
