import React, { useEffect } from "react";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.titleContainer}>
        <div className={styles.title}>Mrt Guessr</div>
      </div>
      <div className={styles.trackContainer}>
        <div className={styles.track}>
          <div className={styles.buttonContainer}>
            <div className={styles.trackButton} />
            <div className={styles.trackText}>Quickplay</div>
          </div>
          <div className={styles.buttonContainer}>
            <div className={styles.trackButton} />
            <div className={styles.trackText}>Singapore Tour</div>
          </div>
          <div className={styles.buttonContainer}>
            <div className={styles.trackButton} />
            <div className={styles.trackText}>Custom Challenge</div>
          </div>
          <div id={"trackLine"} className={styles.trackLine} />
        </div>
      </div>
    </div>
  );
}
