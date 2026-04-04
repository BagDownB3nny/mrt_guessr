import React, { useEffect, useState } from "react";
import styles from "../css/TutorialOverlay.module.css";
import { measureTutorialTarget, TutorialHighlightTarget } from "../utils/tutorialHighlight";
import config from "../config/constants.json";

interface Props {
  visible: boolean;
  highlightTarget: TutorialHighlightTarget;
  instruction: string;
  clickedStationName?: string;
  anchorRect?: DOMRect | null;
  dimmed?: boolean;
  onContinue: () => void;
  showContinue?: boolean;
}

export default function TutorialOverlay({ visible, highlightTarget, instruction, clickedStationName, anchorRect = null, dimmed = true, onContinue, showContinue = true }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tutorialConfig = (config as any).tutorial;

  useEffect(() => {
    if (!visible || highlightTarget === "correct-station" || highlightTarget === "center") {
      setRect(anchorRect ?? null);
      return;
    }

    const measure = () => {
      if (highlightTarget === "clicked-station") {
        setRect(anchorRect ?? measureTutorialTarget(highlightTarget, clickedStationName) ?? null);
        return;
      }
      setRect(measureTutorialTarget(highlightTarget) ?? null);
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
  }, [visible, highlightTarget, clickedStationName, anchorRect]);

  if (!visible) return null;

  const clickedStationCardStyle = highlightTarget === "clicked-station" && anchorRect
    ? {
        left: anchorRect.left + anchorRect.width / 2,
        top: anchorRect.bottom + 16,
        transform: "translateX(-50%)",
      }
    : undefined;

  return (
    <>
      {dimmed && rect && (
        <div
          className={styles.highlightFrame}
          aria-hidden="true"
          style={{
            left: rect.left - tutorialConfig.highlightCutoutPaddingPx,
            top: rect.top - tutorialConfig.highlightCutoutPaddingPx,
            width: rect.width + tutorialConfig.highlightCutoutPaddingPx * 2,
            height: rect.height + tutorialConfig.highlightCutoutPaddingPx * 2,
            borderRadius: 9999,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${tutorialConfig.highlightVeilOpacity}), 0 0 0 3px var(--color-bg-white)`,
          }}
        />
      )}
      {dimmed && !rect && <div className={styles.veil} aria-hidden="true" style={{ opacity: tutorialConfig.highlightVeilOpacity }} />}
      <div className={`${styles.instructionCard} ${styles[`${highlightTarget}Card`]}`} style={clickedStationCardStyle}>
        <div className={styles.cardTopBar} aria-hidden="true" />
        <div className={styles.cardBody}>
          {instruction.split("\n").map((line, index) => (
            <div key={`${index}-${line}`} className={styles.cardLine}>{line.trim()}</div>
          ))}
        </div>
        {showContinue && (
          <button className={styles.continueButton} onClick={onContinue} type="button">
            Continue
          </button>
        )}
      </div>
    </>
  );
}
