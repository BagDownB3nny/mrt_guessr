import React from "react";
import styles from "../css/Home.module.css";
import TrackButtonContainer from "../components/TrackButtonContainer";

type StationConfig = {
  code?: string;
  disabled?: boolean;
  onClick: () => void;
  text: string;
};

type HomeProps = {
  onSelectStation: (route?: string) => void;
};

export default function Home({ onSelectStation }: HomeProps) {
  const stations: StationConfig[] = [
    { text: "Quickplay",          onClick: () => onSelectStation("/quickgame") },
    { text: "Singapore Tour",     onClick: () => onSelectStation("/singaporetour") },
    { text: "Custom Challenges",  onClick: () => onSelectStation(), disabled: true },
  ];

  return (
    <>

      {/* ── First viewport: title + buttons ── */}
      <div className={styles.home}>
        <div className={styles.titleContainer}>
          <div className={styles.title}>Mrt Guessr</div>
        </div>

        {/* Track: line + station buttons.
            The track is inline-flex so it shrink-wraps to button width.
            The line is absolutely positioned inside the track. */}
        <div className={styles.trackContainer}>
          <div className={styles.track} id="stationTrack">
            <div className={styles.trackLine} aria-hidden="true" />
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
            {/* The tail extends the line 2 more screens below the last button,
                still inside the track so it stays aligned */}
            <div className={styles.lineTail} aria-hidden="true" />
          </div>
        </div>
      </div>

    </>
  );
}
