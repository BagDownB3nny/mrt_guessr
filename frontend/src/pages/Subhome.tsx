import React, { useEffect } from "react";
import styles from "../css/Subhome.module.css";
import TrackButtonContainer, {
  ButtonProp,
} from "../components/TrackButtonContainer";

type SubhomeProps = {
  buttonProps: ButtonProp[];
};

export default function Subhome(props: SubhomeProps) {
  const { buttonProps } = props;

  return (
    <div className={styles.home}>
      <div className={styles.trackContainer}>
        <div className={styles.track}>
          {buttonProps.map((buttonProp) => (
            <TrackButtonContainer
              text={buttonProp.text}
              onClick={buttonProp.onClick}
            />
          ))}
          <div id={"trackLine"} className={styles.trackLine} />
        </div>
      </div>
    </div>
  );
}
