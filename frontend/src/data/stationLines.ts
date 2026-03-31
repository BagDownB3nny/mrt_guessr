/**
 * Maps each station to the MRT lines it belongs to.
 * Used for the hint feature.
 */

import {
  NorthSouthLine,
  EastWestLine,
  CircleLine,
  NorthEastLine,
  DowntownLine,
  ThomsonEastCoastLine,
} from "./stations";

export interface LineInfo {
  name: string;
  cssVar: string; // CSS custom property name from palette.css
}

const LINE_DEFS: { stations: string[]; info: LineInfo }[] = [
  { stations: NorthSouthLine,       info: { name: "North-South Line",       cssVar: "--color-nsrl" } },
  { stations: EastWestLine,         info: { name: "East-West Line",         cssVar: "--color-ewl"  } },
  { stations: CircleLine,           info: { name: "Circle Line",            cssVar: "--color-ccl"  } },
  { stations: NorthEastLine,        info: { name: "North-East Line",        cssVar: "--color-nel"  } },
  { stations: DowntownLine,         info: { name: "Downtown Line",          cssVar: "--color-dtl"  } },
  { stations: ThomsonEastCoastLine, info: { name: "Thomson-East Coast Line", cssVar: "--color-tel" } },
];

const stationLineMap = new Map<string, LineInfo[]>();

for (const { stations, info } of LINE_DEFS) {
  for (const s of stations) {
    const existing = stationLineMap.get(s) || [];
    // Avoid duplicate entries (same line listed twice)
    if (!existing.some((l) => l.name === info.name)) {
      existing.push(info);
    }
    stationLineMap.set(s, existing);
  }
}

/** Get the MRT lines a station belongs to. Returns empty array if unknown. */
export function getLinesForStation(station: string): LineInfo[] {
  return stationLineMap.get(station) || [];
}
