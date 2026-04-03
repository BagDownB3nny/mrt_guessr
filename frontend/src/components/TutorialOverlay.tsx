import React from "react";
import styles from "../css/TutorialOverlay.module.css";

export type TutorialHighlightTarget = "station-card" | "lives" | "hints" | "score" | "correct-station" | "center";

interface Props {
  visible: boolean;
  highlightTarget: TutorialHighlightTarget;
  instruction: string;
  onContinue: () => void;
  showContinue?: boolean;
}

export default function TutorialOverlay({ visible, highlightTarget, instruction, onContinue, showContinue = true }: Props) {
  if (!visible) return null;

  return (
    <>
      <div className={styles.veil} aria-hidden="true" />
      {highlightTarget !== "correct-station" && highlightTarget !== "center" && (
        <div className={`${styles.highlightFrame} ${styles[highlightTarget]}`} aria-hidden="true" />
      )}
      <div className={`${styles.instructionCard} ${styles[`${highlightTarget}Card`]}`}>
        <div className={styles.cardTopBar} aria-hidden="true" />
        <div className={styles.cardBody}>{instruction}</div>
        {showContinue && (
          <button className={styles.continueButton} onClick={onContinue} type="button">
            Continue
          </button>
        )}
      </div>
    </>
  );
}
