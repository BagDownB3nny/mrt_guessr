import React from "react";
import styles from "../css/TutorialOverlay.module.css";

export type TutorialHighlightTarget = "station-card" | "lives" | "hints" | "score" | "correct-station";

interface Props {
  visible: boolean;
  highlightTarget: TutorialHighlightTarget;
  instruction: string;
}

export default function TutorialOverlay({ visible, highlightTarget, instruction }: Props) {
  if (!visible) return null;

  return (
    <>
      <div className={styles.veil} aria-hidden="true" />
      <div className={`${styles.highlightFrame} ${styles[highlightTarget]}`} aria-hidden="true" />
      <div className={`${styles.instructionCard} ${styles[`${highlightTarget}Card`]}`}>
        {instruction}
      </div>
    </>
  );
}
