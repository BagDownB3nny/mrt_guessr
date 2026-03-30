import React from "react";
import styles from "../css/Home.module.css";
import TrackButtonContainer from "../components/TrackButtonContainer";

type StationConfig = {
  code: string;
  disabled?: boolean;
  onClick: () => void;
  text: string;
};

type HomeProps = {
  onSelectStation: (route?: string) => void;
};

export default function Home(props: HomeProps) {
  const { onSelectStation } = props;

  const stations: StationConfig[] = [
    {
      code: "MG1",
      onClick: () => onSelectStation("/quickgame"),
      text: "Quickplay",
    },
    {
      code: "MG2",
      onClick: () => onSelectStation("/singaporetour"),
      text: "Singapore Tour",
    },
    {
      code: "MG3",
      disabled: true,
      onClick: () => onSelectStation(),
      text: "Custom Challenge",
    },
  ];

  return (
    <div className={styles.home}>
      <div className={styles.homeShell}>
        <div className={styles.titleContainer}>
          <div className={styles.title}>Mrt Guessr</div>
          <div className={styles.subtitle}>Pick a route and start guessing.</div>
        </div>
        <div className={styles.trackContainer}>
          <div className={styles.track}>
            {stations.map((station) => (
              <TrackButtonContainer
                key={station.code}
                code={station.code}
                disabled={station.disabled}
                onClick={station.onClick}
                text={station.text}
                variant="station"
              />
            ))}
            <div id={"trackLine"} className={styles.trackLine} />
          </div>
        </div>
        <div className={styles.lineTail} aria-hidden="true" />
      </div>
    </div>
  );
}
