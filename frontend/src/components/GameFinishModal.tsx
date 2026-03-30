import Modal from "react-modal";
import CloseButton from "react-bootstrap/CloseButton";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../css/GameFinishModal.module.css";

Modal.setAppElement("#root");

interface GuessStats {
  inOneTry: number;
  inTwoTries: number;
  inThreeTries: number;
  afterThreeTries: number;
}

interface Props {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  guessStats: GuessStats;
  getScore: () => string;
}

const ROWS: { label: string; key: keyof GuessStats; points: number }[] = [
  { label: "Found in 1 try",          key: "inOneTry",        points: 3 },
  { label: "Found in 2 tries",        key: "inTwoTries",      points: 2 },
  { label: "Found in 3 tries",        key: "inThreeTries",    points: 1 },
  { label: "Found after 3 tries",     key: "afterThreeTries", points: 0 },
];

export default function GameFinishModal({ modalOpen, setModalOpen, guessStats, getScore }: Props) {
  return (
    <Modal
      isOpen={modalOpen}
      contentLabel="Game results"
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
      onRequestClose={() => setModalOpen(false)}
    >
      <div className={styles.modalContainer}>
        <div className={styles.closeButtonRow}>
          <div className={styles.closeButtonContainer} />
          <div className={styles.modalTitle}>Game Results</div>
          <div className={styles.closeButtonContainer}>
            <CloseButton onClick={() => setModalOpen(false)} />
          </div>
        </div>

        <div className={styles.rowContainer}>
          {ROWS.map(({ label, key, points }) => (
            <div key={key} className={styles.row}>
              <div className={styles.text}>
                {label} ({points} {points === 1 ? "point" : "points"} each):
              </div>
              <div className={styles.number}>{guessStats[key]}</div>
            </div>
          ))}
        </div>

        <div className={styles.scoresRow}>
          <div className={styles.text}>Score:</div>
          <div className={styles.number}>{getScore()}</div>
        </div>
      </div>
    </Modal>
  );
}
