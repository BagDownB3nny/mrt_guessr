import React, { useEffect } from "react";
import styles from "../css/Subhome.module.css";

export type ButtonProp = {
  onClick?: () => void;
  text: string;
};

export default function TrackButtonContainer(props: ButtonProp) {
  const { onClick, text } = props;

  return (
    <div className={styles.buttonContainer} onClick={onClick}>
      <div className={styles.trackButton} />
      <div className={styles.trackText}>{text}</div>
    </div>
  );
}
