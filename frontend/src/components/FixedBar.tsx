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
      <div className={styles.leftColumn}>
        <button
          className={styles.actionButton}
          onClick={() => navigate("/")}
          type="button"
        >
          Quit game
        </button>
        <button
          className={styles.actionButton}
          onClick={restartGame}
          type="button"
        >
          Restart Game
        </button>
      </div>
      <div className={styles.middleColumn}>
        {currentStation && (
          <div className={styles.stationName}>{currentStation}</div>
        )}
        {!currentStation && (
          <div className={styles.viewScore}>
            <button onClick={() => setModalOpen(true)} type="button">
              View stats
            </button>
          </div>
        )}
        <div className={styles.triesBox}>
          {arrayData.map((num) => {
            if (tries > num) {
              return (
                <img key={num} src="/greyX.png" className={styles.try} alt="" />
              );
            } else {
              return (
                <img key={num} src="/redX.png" className={styles.try} alt="" />
              );
            }
          })}
        </div>
      </div>
      <div className={styles.rightColumn}>
        <div className={styles.stationsLeftContainer}>
          <div className={styles.stationsLeftText}>Stations found:</div>
          <div className={styles.stationsLeftScore}>{getStationsLeft()}</div>
        </div>
        <div className={styles.scoreContainer}>
          <div className={styles.scoreText}>Current score:</div>
          <div className={styles.score}>{getScore()}</div>
        </div>
      </div>
    </div>
  );
};

export default FixedBar;
