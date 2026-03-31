import React, { useState } from "react";
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
  finalTimeMs?: number | null;
}

function getTierMessage(score: number, maxScore: number): string {
  if (maxScore === 0) return config.tierMessages[config.tierMessages.length - 1].message;
  const pct = score / maxScore;
  const tier = config.tierMessages.find((t) => pct >= t.minPct);
  return tier ? tier.message : config.tierMessages[config.tierMessages.length - 1].message;
}

const LEADERBOARD_THRESHOLD_MS = (config as any).speedrun.leaderboardThresholdMs as number;

export default function GameFinishModal({ modalOpen, setModalOpen, guessStats, onPlayAgain, finalTimeMs }: Props) {
  const navigate = useNavigate();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const score = guessStats.inOneTry * 3 + guessStats.inTwoTries * 2 + guessStats.inThreeTries * 1;
  const total = guessStats.inOneTry + guessStats.inTwoTries + guessStats.inThreeTries + guessStats.afterThreeTries;
  const found = guessStats.inOneTry + guessStats.inTwoTries + guessStats.inThreeTries;
  const maxScore = total * 3;
  const tierMessage = getTierMessage(score, maxScore);
  const isSpeedrun = finalTimeMs != null;

  return (
    <Modal
      isOpen={modalOpen}
      contentLabel="Game results"
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
      // No onRequestClose — user cannot dismiss by clicking outside
    >
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.header}>
          {isSpeedrun ? (
            <div className={styles.timerCapsule}>
              <span className={styles.timerMain}>{formatMs(finalTimeMs!).split('.')[0]}</span>
              <span className={styles.timerSub}>.{formatMs(finalTimeMs!).split('.')[1]}</span>
            </div>
          ) : (
            <>
              <div className={styles.headline}>Found {found}/{total} stations</div>
              <div className={styles.subline}>{tierMessage}</div>
            </>
          )}
        </div>

        {/* Stats grid */}
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
          {/* Leaderboard button for qualifying speedrun times */}
          {isSpeedrun && finalTimeMs !== null && finalTimeMs! <= LEADERBOARD_THRESHOLD_MS && (
            <button
              className={styles.btnLeaderboard}
              onClick={() => setShowLeaderboard(true)}
              type="button"
            >
              🏆 Leaderboard
            </button>
          )}
          <button className={styles.btnPrimary} onClick={onPlayAgain} type="button">
            Play again
          </button>
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
