import React, { Dispatch, SetStateAction } from "react";
import styles from "../css/FixedBar.module.css";
import { useNavigate } from "react-router-dom";

interface Props {
  currentStation: String;
  tries: number;
  getScore: () => string;
  getStationsLeft: () => string;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  restartGame: () => void;
}

const FixedBar: React.FC<Props> = (props) => {
  const {
    currentStation,
    tries,
    getScore,
    getStationsLeft,
    setModalOpen,
    restartGame,
  } = props;
  const arrayData = [2, 1, 0];
  const navigate = useNavigate();

  return (
    <div className={styles.fixedBar}>
      {/* Middle: station prompt + tries */}
      <div className={styles.middleColumn}>
        {currentStation ? (
          <div className={styles.stationName}>{currentStation}</div>
        ) : (
          <div className={styles.viewScore}>
            <button onClick={() => setModalOpen(true)} type="button">
              View stats
            </button>
          </div>
        )}
        <div className={styles.triesBox}>
          {arrayData.map((num) =>
            tries > num ? (
              <img key={num} src="/greyX.png" className={styles.try} alt="" />
            ) : (
              <img key={num} src="/redX.png" className={styles.try} alt="" />
            )
          )}
        </div>
      </div>

      {/* Right: score + stations found */}
      <div className={styles.rightColumn}>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>Found</div>
          <div className={styles.statValue}>{getStationsLeft()}</div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>Score</div>
          <div className={styles.statValue}>{getScore()}</div>
        </div>
      </div>

      {/* Floating icon buttons: bottom-right */}
      <div className={styles.iconButtons}>
        <button
          className={styles.iconBtn}
          onClick={() => navigate("/")}
          type="button"
          aria-label="Quit game"
          title="Quit game"
        >
          {/* Home icon */}
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
          {/* Circular arrow / restart icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FixedBar;
