import React, { useEffect, useState } from "react";
import styles from "../css/TutorialOverlay.module.css";

export type TutorialHighlightTarget = "station-card" | "lives" | "hints" | "score" | "correct-station" | "center" | "clicked-station";

interface Props {
  visible: boolean;
  highlightTarget: TutorialHighlightTarget;
  instruction: string;
  clickedStationName?: string;
  onContinue: () => void;
  showContinue?: boolean;
}

export default function TutorialOverlay({ visible, highlightTarget, instruction, clickedStationName, onContinue, showContinue = true }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!visible || highlightTarget === "correct-station" || highlightTarget === "center" || highlightTarget === "clicked-station") {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(`[data-tutorial-target="${highlightTarget}"]`) as HTMLElement | null;
      setRect(el ? el.getBoundingClientRect() : null);
    };

    measure();
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("resize", measure);
    };
  }, [visible, highlightTarget, clickedStationName]);

  if (!visible) return null;

  return (
    <>
      {highlightTarget !== "correct-station" && <div className={styles.veil} aria-hidden="true" />}
      {highlightTarget !== "correct-station" && highlightTarget !== "center" && highlightTarget !== "clicked-station" && rect && (
        <div
          className={styles.highlightFrame}
          aria-hidden="true"
          style={{
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
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
