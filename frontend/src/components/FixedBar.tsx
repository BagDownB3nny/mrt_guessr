import React, { Dispatch, SetStateAction } from "react";
import styles from "../css/FixedBar.module.css";
import { useNavigate } from "react-router-dom";

interface Props {
  currentStation: string;
  tries: number;
  getStationsLeft: () => string;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  restartGame: () => void;
  minimal?: boolean; // show only station capsule (e.g. during instructions)
  highlightStationCard?: boolean;
  highlightLives?: boolean;
  highlightScore?: boolean;
}

const FixedBar: React.FC<Props> = (props) => {
  const {
    currentStation,
    tries,
    getStationsLeft,
    setModalOpen,
    restartGame,
    minimal = false,
    highlightStationCard = false,
    highlightLives = false,
    highlightScore = false,
  } = props;
  const arrayData = [2, 1, 0];
  const navigate = useNavigate();

  return (
    <div className={`${styles.fixedBar} ${minimal ? styles.fixedBarMinimal : ""}`}>
      {/* Left: found */}
      {!minimal && (
        <div className={`${styles.leftColumn} ${highlightScore ? styles.tutorialHighlight : ""}`} data-tutorial-target="score">
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>Found</div>
            <div className={styles.statValue}>{getStationsLeft()}</div>
          </div>
        </div>
      )}

      {/* Middle: station name + tries */}
      <div className={minimal ? styles.middleColumnFull : styles.middleColumn}>
        {currentStation ? (
          <div key={currentStation} className={`${styles.stationCapsule} ${highlightStationCard ? styles.tutorialHighlight : ""}`} data-tutorial-target="station-card">
            <span className={styles.stationName}>{currentStation}</span>
          </div>
        ) : (
          !minimal && (
            <div className={styles.viewStats}>
              <button onClick={() => setModalOpen(true)} type="button">
                View stats
              </button>
            </div>
          )
        )}
        {!minimal && (
          <div className={`${styles.triesBox} ${highlightLives ? styles.tutorialHighlight : ""}`} data-tutorial-target="lives">
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
        )}
      </div>

      {/* Right: home + retry */}
      {!minimal && (
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
      )}
    </div>
  );
};

export default FixedBar;
