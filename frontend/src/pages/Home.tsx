import React, { useEffect } from "react";
import styles from "../css/Home.module.css";
import TrackButtonContainer from "../components/TrackButtonContainer";
import { useNavigate } from "react-router-dom";

export default function Home(props: any) {
  const { scrollToNextPage } = props;

  const navigate = useNavigate();

  const quickplayProps = {
    text: "Quickplay",
    onClick: () => navigate("/quickgame"),
  };

  const singaporeTourProps = {
    text: "Singapore Tour",
    onClick: () => navigate("/singaporetour"),
  };

  const customChallengeProps = {
    text: "Custom Challenge",
    onClick: () => scrollToNextPage,
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
