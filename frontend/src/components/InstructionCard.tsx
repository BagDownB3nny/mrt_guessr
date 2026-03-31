/**
 * InstructionCard — first-visit how-to-play overlay.
 *
 * Shown over the sea-colour veil before the game starts.
 * Sets a cookie so returning players skip it for 30 days.
 */

import React from "react";
import styles from "../css/InstructionCard.module.css";

const COOKIE_NAME = "mrt_guessr_instructions_seen";
const COOKIE_DAYS = 30;

/** Check if the instruction cookie exists */
export function hasSeenInstructions(): boolean {
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
}

/** Set the instruction cookie */
function setInstructionCookie(): void {
  const expires = new Date(Date.now() + COOKIE_DAYS * 86400000).toUTCString();
  document.cookie = `${COOKIE_NAME}=1; expires=${expires}; path=/; SameSite=Lax`;
}

interface Props {
  onStart: () => void;
}

export default function InstructionCard({ onStart }: Props) {
  const handleStart = () => {
    setInstructionCookie();
    onStart();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h1 className={styles.title}>How to Play</h1>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepText}>
              A station name appears at the bottom of the screen
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepText}>
              Find and tap the matching station on the MRT map
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepText}>
              You get 3 tries per station — wrong guesses show up in red
            </div>
          </div>
        </div>

        {/* Visual example: station marker */}
        <div className={styles.exampleSection}>
          <div className={styles.exampleLabel}>Stations look like this:</div>
          <div className={styles.exampleMarker}>
            <div className={styles.markerOuter}>
              <div className={styles.markerInner} />
            </div>
            <span className={styles.exampleName}>Bishan</span>
          </div>
        </div>

        <div className={styles.tip}>
          Pinch to zoom, drag to pan
        </div>

        <button className={styles.startButton} onClick={handleStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}
