export interface GuessStats {
  inOneTry: number;
  inTwoTries: number;
  inThreeTries: number;
  afterThreeTries: number;
  foundStations: string[];
  missedStations: string[];
}

export function createEmptyGuessStats(): GuessStats {
  return {
    inOneTry: 0,
    inTwoTries: 0,
    inThreeTries: 0,
    afterThreeTries: 0,
    foundStations: [],
    missedStations: [],
  };
}

export function applyGuessToStats(prev: GuessStats, station: string, triesUsed: number): GuessStats {
  const t = Math.max(0, triesUsed);
  const isFound = t > 0;

  return {
    inOneTry: prev.inOneTry + (t === 3 ? 1 : 0),
    inTwoTries: prev.inTwoTries + (t === 2 ? 1 : 0),
    inThreeTries: prev.inThreeTries + (t === 1 ? 1 : 0),
    afterThreeTries: prev.afterThreeTries + (t === 0 ? 1 : 0),
    foundStations: isFound ? [...prev.foundStations, station] : prev.foundStations,
    missedStations: isFound ? prev.missedStations : [...prev.missedStations, station],
  };
}

export function setAllStationLabelsVisible(visible: boolean): void {
  document.querySelectorAll<HTMLElement>('[id$="_Text"]').forEach((el) => {
    el.style.display = visible ? "block" : "none";
  });
}
