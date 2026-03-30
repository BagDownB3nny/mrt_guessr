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
}

const ROWS: { label: string; key: keyof GuessStats }[] = [
  { label: "Found in 1 try",      key: "inOneTry" },
  { label: "Found in 2 tries",    key: "inTwoTries" },
  { label: "Found in 3 tries",    key: "inThreeTries" },
  { label: "Found after 3 tries", key: "afterThreeTries" },
];

export default function GameFinishModal({ modalOpen, setModalOpen, guessStats }: Props) {
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
          {ROWS.map(({ label, key }) => (
            <div key={key} className={styles.row}>
              <div className={styles.text}>{label}:</div>
              <div className={styles.number}>{guessStats[key]}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
