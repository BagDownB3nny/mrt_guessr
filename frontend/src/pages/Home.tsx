import React from "react";
import styles from "../css/Home.module.css";
import TrackButtonContainer from "../components/TrackButtonContainer";

const KOFI_URL = "https://ko-fi.com/ratdownr3my";

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
    { text: "Speedrun",           onClick: () => onSelectStation("/speedrun"), disabled: true },
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
            {/* Ko-fi button — sits on the line below all station buttons */}
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.kofiButton}
            >
              ☕ Buy the devs a coffee
            </a>
            {/* The tail extends the line 2 more screens below the last button,
                still inside the track so it stays aligned */}
            <div className={styles.lineTail} aria-hidden="true" />
          </div>
        </div>
      </div>

    </>
  );
}
