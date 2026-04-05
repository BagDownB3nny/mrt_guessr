import config from "../config/constants.json";
import { getAllStations, sampleStations } from "../data/stations";

export type StandardGameMode = "quickplay" | "tutorial" | "speedrun" | "singapore-tour";

const QUICKGAME_STATION_COUNT = config.gameplay.quickgameStationCount;
const SPEEDRUN_STATION_COUNT = (config.gameplay as any).speedrunStationCount ?? 20;
const TUTORIAL_STATIONS_DEFAULT = ((config as any).tutorial.stationsDefault ?? ["Dhoby Ghaut", "Buona Vista", "Hume", "Siglap", "Gul Circle"]) as string[];
const TUTORIAL_STATIONS_THREE_WRONG = ((config as any).tutorial.stationsThreeWrongPath ?? ["Dhoby Ghaut", "Buona Vista", "Hume", "Woodlands", "Rochor"]) as string[];

export interface StandardGameModeConfig {
  isSpeedrun: boolean;
  tutorialMode: boolean;
  getInitialStations: () => string[];
}

export function getStandardGameModeConfig(mode: StandardGameMode): StandardGameModeConfig {
  switch (mode) {
    case "tutorial":
      return {
        isSpeedrun: false,
        tutorialMode: true,
        getInitialStations: () => [...TUTORIAL_STATIONS_DEFAULT],
      };
    case "speedrun":
      return {
        isSpeedrun: true,
        tutorialMode: false,
        getInitialStations: () => sampleStations(SPEEDRUN_STATION_COUNT),
      };
    case "singapore-tour":
      return {
        isSpeedrun: false,
        tutorialMode: false,
        getInitialStations: () => getAllStations(),
      };
    case "quickplay":
    default:
      return {
        isSpeedrun: false,
        tutorialMode: false,
        getInitialStations: () => sampleStations(QUICKGAME_STATION_COUNT),
      };
  }
}

export function getTutorialRemainingStationsAfterThreeWrong(currentStation: string): string[] {
  const currentIdx = TUTORIAL_STATIONS_DEFAULT.indexOf(currentStation as (typeof TUTORIAL_STATIONS_DEFAULT)[number]);
  if (currentIdx < 0) return [];

  if (currentIdx <= 2) {
    return [...TUTORIAL_STATIONS_THREE_WRONG.slice(currentIdx + 1)];
  }

  if (currentStation === "Siglap") {
    return ["Rochor"];
  }

  return [];
}
