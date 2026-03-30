import { useControls } from "react-zoom-pan-pinch";
import styles from "../css/MrtMap.module.css";

export default function Controls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className={styles.controls} aria-label="Map controls">
      <button
        className={styles.controlButton}
        onClick={() => zoomOut()}
        type="button"
        aria-label="Zoom out"
      >
        -
      </button>
      <button
        className={styles.controlButton}
        onClick={() => zoomIn()}
        type="button"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        className={styles.controlButton}
        onClick={() => resetTransform()}
        type="button"
        aria-label="Reset map"
      >
        Reset
      </button>
    </div>
  );
}
