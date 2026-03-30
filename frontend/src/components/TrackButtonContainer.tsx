import React from "react";
import homeStyles from "../css/Home.module.css";
import styles from "../css/Subhome.module.css";

export type ButtonProp = {
  code?: string;
  disabled?: boolean;
  onClick?: () => void;
  text: string;
  variant?: "pill" | "station";
};

export default function TrackButtonContainer(props: ButtonProp) {
  const { code, disabled = false, onClick, text, variant = "pill" } = props;

  if (variant === "station") {
    return (
      <button
        className={homeStyles.stationButton}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        <span className={homeStyles.stationMarker} aria-hidden="true">
          {code ? <span className={homeStyles.stationCode}>{code}</span> : null}
        </span>
        <span className={homeStyles.stationLabelGroup}>
          <span className={homeStyles.stationName}>{text}</span>
          {disabled ? (
            <span className={homeStyles.stationMeta}>Coming soon</span>
          ) : null}
        </span>
      </button>
    );
  }

  return (
    <div className={styles.buttonContainer} onClick={onClick}>
      <div className={styles.trackButton} />
      <div className={styles.trackText}>{text}</div>
    </div>
  );
}
