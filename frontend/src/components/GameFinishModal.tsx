import React, { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import styles from "../css/GameFinishModal.module.css";
import { useNavigate } from "react-router-dom";
import config from "../config/constants.json";
import { formatMs } from "../pages/Game";
import SpeedrunLeaderboard from "./SpeedrunLeaderboard";

Modal.setAppElement("#root");

interface GuessStats {
  inOneTry: number;
  inTwoTries: number;
  inThreeTries: number;
  afterThreeTries: number;
  foundStations: string[];
  missedStations: string[];
}

interface Props {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  guessStats: GuessStats;
  onPlayAgain: () => void;
  onExploreMap?: () => void;
  finalTimeMs?: number | null;
}

function buildShareText(scoreStr: string, isSpeedrun: boolean, timeStr?: string): string {
  if (isSpeedrun && timeStr) {
    return `I completed MRT Guessr Speedrun in ${timeStr}! 🚇\nPlay at mrt-guessr.vercel.app`;
  }
  return `I scored ${scoreStr}/10 on MRT Guessr! 🚇\nPlay at mrt-guessr.vercel.app`;
}

const LEADERBOARD_THRESHOLD_MS = (config as any).speedrun.leaderboardThresholdMs as number;

const SCORE_ANIM_MS = 2000; // total duration of score count-up

export default function GameFinishModal({ modalOpen, setModalOpen, guessStats, onPlayAgain, onExploreMap, finalTimeMs }: Props) {
  const navigate = useNavigate();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSpeedrun = finalTimeMs != null;

  // Auto-open leaderboard when modal first appears if player qualifies
  useEffect(() => {
    if (modalOpen && isSpeedrun && finalTimeMs !== null && finalTimeMs <= LEADERBOARD_THRESHOLD_MS) {
      setShowLeaderboard(true);
    }
  }, [modalOpen, isSpeedrun, finalTimeMs]);

  const handleShare = async () => {
    const scoreStr = finalScore.toFixed(1);
    const timeStr = finalTimeMs != null ? formatMs(finalTimeMs) : undefined;
    const text = buildShareText(scoreStr, isSpeedrun, timeStr);
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled or share failed — no-op
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), config.transitions.copiedResetMs);
      } catch {
        // clipboard not available
      }
    }
  };

  const rawScore = guessStats.inOneTry * 3 + guessStats.inTwoTries * 2 + guessStats.inThreeTries * 1;
  const total = guessStats.inOneTry + guessStats.inTwoTries + guessStats.inThreeTries + guessStats.afterThreeTries;

  const maxScore = total * 3;
  // Score out of 10, rounded to 1dp
  const finalScore = maxScore === 0 ? 0 : Math.round((rawScore / maxScore) * 100) / 10;

  // Animated score count-up
  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!modalOpen || isSpeedrun) return;
    setDisplayScore(0);
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      // Ease-out cubic: progress decelerates as it approaches 1
      const t = Math.min(elapsed / SCORE_ANIM_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(eased * finalScore * 10) / 10;
      setDisplayScore(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayScore(finalScore);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [modalOpen, finalScore, isSpeedrun]);

  return (
    <Modal
      isOpen={modalOpen}
      contentLabel="Game results"
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
      // No onRequestClose — user cannot dismiss by clicking outside
    >
      <div className={styles.modalContainer}>
        {/* Close button — lets player explore the map */}
        {onExploreMap && (
          <button
            className={styles.closeButton}
            onClick={onExploreMap}
            aria-label="Close and explore map"
            type="button"
          >
            ✕
          </button>
        )}
        {/* Header */}
        <div className={styles.header}>
          {isSpeedrun ? (
            <div className={styles.timerCapsule}>
              <span className={styles.timerMain}>{formatMs(finalTimeMs!).split('.')[0]}</span>
              <span className={styles.timerSub}>.{formatMs(finalTimeMs!).split('.')[1]}</span>
            </div>
          ) : (
            <>
              <div className={styles.scoreDisplay}>
                <span className={styles.scoreNumber}>{displayScore.toFixed(1)}</span>
                <span className={styles.scoreOutOf}>/10</span>
              </div>
            </>
          )}
        </div>

        {/* Stats grid — hidden for speedrun */}
        {!isSpeedrun && (
          <div className={styles.grid}>
            <div className={`${styles.cell} ${styles.cellGreen}`}>
              <div className={styles.cellNumber}>{guessStats.inOneTry}</div>
              <div className={styles.cellLabel}>1st try</div>
            </div>
            <div className={`${styles.cell} ${styles.cellYellow}`}>
              <div className={styles.cellNumber}>{guessStats.inTwoTries}</div>
              <div className={styles.cellLabel}>2nd try</div>
            </div>
            <div className={`${styles.cell} ${styles.cellOrange}`}>
              <div className={styles.cellNumber}>{guessStats.inThreeTries}</div>
              <div className={styles.cellLabel}>3rd try</div>
            </div>
            <div className={`${styles.cell} ${styles.cellRed}`}>
              <div className={styles.cellNumber}>{guessStats.afterThreeTries}</div>
              <div className={styles.cellLabel}>Missed</div>
            </div>
          </div>
        )}

        {/* Station lists: found | missed — hidden for speedrun */}
        {!isSpeedrun && (
          <div className={styles.stationLists}>
            <div className={styles.stationListBox}>
              <div className={styles.stationListTitle}>Found</div>
              <div className={styles.stationListScroll}>
                {guessStats.foundStations.length === 0
                  ? <span className={styles.stationListEmpty}>—</span>
                  : guessStats.foundStations.map((s) => (
                      <div key={s} className={styles.stationPill}>{s}</div>
                    ))}
              </div>
            </div>
            <div className={styles.stationListBox}>
              <div className={styles.stationListTitle}>Missed</div>
              <div className={styles.stationListScroll}>
                {guessStats.missedStations.length === 0
                  ? <span className={styles.stationListEmpty}>—</span>
                  : guessStats.missedStations.map((s) => (
                      <div key={s} className={`${styles.stationPill} ${styles.stationPillMissed}`}>{s}</div>
                    ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {/* Leaderboard — always visible for speedrun */}
          {isSpeedrun && (
            <button
              className={styles.btnLeaderboard}
              onClick={() => setShowLeaderboard(true)}
              type="button"
            >
              🏆 Leaderboard
            </button>
          )}
          {/* Play again */}
          <button className={styles.btnPrimary} onClick={onPlayAgain} type="button">
            Play again
          </button>
          {/* Share */}
          <button className={styles.btnShare} onClick={handleShare} type="button">
            {copied ? "Copied!" : "Share"}
          </button>
          {/* Home */}
          <button className={styles.btnSecondary} onClick={() => navigate("/")} type="button">
            Home
          </button>
        </div>
      </div>
      <SpeedrunLeaderboard
        isOpen={showLeaderboard}
        playerTimeMs={finalTimeMs ?? 0}
        onClose={() => setShowLeaderboard(false)}
      />
    </Modal>
  );
}
