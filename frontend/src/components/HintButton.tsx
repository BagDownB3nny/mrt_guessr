/**
 * HintButton — top-left circle with "?" that reveals the MRT line(s)
 * the current station belongs to.
 *
 * Before press: circle with "?"
 * After press: capsule(s) showing line name(s) with line colour
 */

import React, { useEffect, useState } from "react";
import { getLinesForStation, LineInfo } from "../data/stationLines";
import styles from "../css/HintButton.module.css";

interface Props {
  currentStation: string;
}

export default function HintButton({ currentStation }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [lines, setLines] = useState<LineInfo[]>([]);

  // Reset when station changes
  useEffect(() => {
    setRevealed(false);
    setLines(getLinesForStation(currentStation));
  }, [currentStation]);

  if (!currentStation) return null;

  if (!revealed) {
    return (
      <button
        className={styles.hintCircle}
        onClick={() => setRevealed(true)}
        aria-label="Show hint"
      >
        ?
      </button>
    );
  }

  return (
    <div className={styles.capsuleContainer}>
      {lines.map((line) => (
        <div
          key={line.name}
          className={styles.lineCapsule}
          style={{ backgroundColor: `var(${line.cssVar})` }}
        >
          {line.name}
        </div>
      ))}
    </div>
  );
}
