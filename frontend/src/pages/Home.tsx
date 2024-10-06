import React, { useEffect } from "react";
import styles from "../css/Home.module.css";
import TrackButtonContainer from "../components/TrackButtonContainer";

export default function Home(props: any) {
  const { scrollToNextPage } = props;

  const quickplayProps = {
    text: "Quickplay",
    onClick: () => console.log("Quickplay"),
  };

  const singaporeTourProps = {
    text: "Singapore Tour",
    onClick: scrollToNextPage,
  };

  const customChallengeProps = {
    text: "Custom Challenge",
    onClick: () => console.log("Custom Challenge"),
  };

  return (
    <div className={styles.home}>
      <div className={styles.titleContainer}>
        <div className={styles.title}>Mrt Guessr</div>
      </div>
      <div className={styles.trackContainer}>
        <div className={styles.track}>
          <TrackButtonContainer {...quickplayProps} />
          <TrackButtonContainer {...singaporeTourProps} />
          <TrackButtonContainer {...customChallengeProps} />
          <div id={"trackLine"} className={styles.trackLine} />
        </div>
      </div>
    </div>
  );
}
