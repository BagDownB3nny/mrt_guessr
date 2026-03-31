import React, { Dispatch, SetStateAction } from "react";
import styles from "../css/FixedBar.module.css";
import { useNavigate } from "react-router-dom";

interface Props {
  currentStation: string;
  tries: number;
  getStationsLeft: () => string;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  restartGame: () => void;
  isSpeedrun?: boolean;
  elapsedMs?: number;
}

const FixedBar: React.FC<Props> = (props) => {
  const {
    currentStation,
    tries,
    getStationsLeft,
    setModalOpen,
    restartGame,
    isSpeedrun = false,
    elapsedMs = 0,
  } = props;

  const formatMs = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    const ms3 = (ms % 1000).toString().padStart(3, "0");
    return m > 0 ? `${m}:${s}.${ms3}` : `${s}.${ms3}`;
  };
  const arrayData = [2, 1, 0];
  const navigate = useNavigate();

  return (
    <div className={styles.fixedBar}>
      {/* Left: found + optional speedrun timer */}
      <div className={styles.leftColumn}>
        {isSpeedrun ? (
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>Time</div>
            <div className={`${styles.statValue} ${styles.timerValue}`}>{formatMs(elapsedMs)}</div>
          </div>
        ) : (
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>Found</div>
            <div className={styles.statValue}>{getStationsLeft()}</div>
          </div>
        )}
      </div>

      {/* Middle: station name + tries */}
      <div className={styles.middleColumn}>
        {currentStation ? (
          <div key={currentStation} className={styles.stationCapsule}>
            <span className={styles.stationName}>{currentStation}</span>
          </div>
        ) : (
          <div className={styles.viewStats}>
            <button onClick={() => setModalOpen(true)} type="button">
              View stats
            </button>
          </div>
        )}
        <div className={styles.triesBox}>
          {arrayData.map((num) => {
            const isSpent = tries <= num;
            return (
              <span
                key={num}
                className={`${styles.tryMarker} ${isSpent ? styles.tryMarkerSpent : ""}`}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>

      {/* Right: home + retry */}
      <div className={styles.rightColumn}>
        <div className={styles.iconButtons}>
          <button
            className={styles.iconBtn}
            onClick={() => navigate("/")}
            type="button"
            aria-label="Quit game"
            title="Quit game"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12L12 3l9 9" />
              <path d="M9 21V12h6v9" />
              <path d="M3 12v9h18v-9" />
            </svg>
          </button>
          <button
            className={styles.iconBtn}
            onClick={restartGame}
            type="button"
            aria-label="Restart game"
            title="Restart game"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FixedBar;
