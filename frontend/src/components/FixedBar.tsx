import React from "react";
import styles from "../css/FixedBar.module.css";

interface Props {
  currentStation: String;
  tries: number;
  getScore: () => string;
  getStationsLeft: () => string;
}

const FixedBar: React.FC<Props> = (props) => {
  const { currentStation, tries, getScore, getStationsLeft } = props;
  const arrayData = [2, 1, 0];

  return (
    <div className={styles.fixedBar}>
      <div className={styles.leftColumn}>
        <div className={styles.quitButton}>Quit game</div>
      </div>
      <div className={styles.middleColumn}>
        <div className={styles.stationName}>{currentStation}</div>
        <div className={styles.triesBox}>
          {arrayData.map((num) => {
            if (tries > num) {
              return <img key={num} src="/greyX.png" className={styles.try} />;
            } else {
              return <img src="/redX.png" className={styles.try} />;
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
