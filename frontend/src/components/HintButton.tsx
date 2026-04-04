/**
 * HintButton — progressive hint system.
 *
 * Always visible as a "Hints" capsule.
 * After 1st wrong answer: line colour capsule pops in below.
 * After 2nd wrong answer: zone capsule pops in below.
 * Resets on correct answer (station change).
 *
 * triesLeft starts at TRIES_PER_STATION (3).
 * wrongCount = TRIES_PER_STATION - triesLeft
 */

import React, { useEffect, useRef, useState } from "react";
import { getLinesForStation, LineInfo } from "../data/stationLines";
import { getZoneForStation } from "../data/stationZones";
import styles from "../css/HintButton.module.css";

interface Props {
  currentStation: string;
  triesLeft: number;
  triesPerStation: number;
  highlighted?: boolean;
}

export default function HintButton({ currentStation, triesLeft, triesPerStation, highlighted = false }: Props) {
  const [lines, setLines] = useState<LineInfo[]>([]);
  const [zone, setZone] = useState<string | null>(null);
  const [showLine, setShowLine] = useState(false);
  const [showZone, setShowZone] = useState(false);
  const prevStation = useRef(currentStation);
  const lineKeyRef = useRef(0);
  const zoneKeyRef = useRef(0);
  const [lineKey, setLineKey] = useState(0);
  const [zoneKey, setZoneKey] = useState(0);

  // Reset on station change
  useEffect(() => {
    if (prevStation.current !== currentStation) {
      prevStation.current = currentStation;
      setShowLine(false);
      setShowZone(false);
    }
    setLines(getLinesForStation(currentStation));
    setZone(getZoneForStation(currentStation));
  }, [currentStation]);

  // Show hints progressively based on wrong count
  const wrongCount = triesPerStation - triesLeft;

  useEffect(() => {
    if (wrongCount >= 1 && !showLine) {
      lineKeyRef.current += 1;
      setLineKey(lineKeyRef.current);
      setShowLine(true);
    }
  }, [wrongCount, showLine]);

  useEffect(() => {
    if (wrongCount >= 2 && !showZone) {
      zoneKeyRef.current += 1;
      setZoneKey(zoneKeyRef.current);
      setShowZone(true);
    }
  }, [wrongCount, showZone]);

  if (!currentStation) return null;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.hintsContainer} ${highlighted ? styles.tutorialHighlight : ""}`} data-tutorial-target="hints">
        <div className={styles.hintLabel}>Hints</div>
        {showLine && lines.length > 0 && (
          <div key={`line-${lineKey}`} className={styles.hintRow}>
            {lines.map((line) => (
              <div
                key={line.name}
                className={`${styles.lineCapsule} ${styles.popIn}`}
                style={{ backgroundColor: `var(${line.cssVar})` }}
              >
                {line.name}
              </div>
            ))}
          </div>
        )}
        {showZone && zone && (
          <div key={`zone-${zoneKey}`} className={`${styles.zoneCapsule} ${styles.popIn}`}>
            {zone}
          </div>
        )}
      </div>
    </div>
  );
}
