import Modal from "react-modal";
import styles from "../css/GameFinishModal.module.css";
import { useNavigate } from "react-router-dom";

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
  onPlayAgain: () => void;
}

export default function GameFinishModal({ modalOpen, setModalOpen, guessStats, onPlayAgain }: Props) {
  const navigate = useNavigate();
  const total = guessStats.inOneTry + guessStats.inTwoTries + guessStats.inThreeTries + guessStats.afterThreeTries;

  return (
    <Modal
      isOpen={modalOpen}
      contentLabel="Game results"
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
      onRequestClose={() => setModalOpen(false)}
    >
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.header}>
          <img src="/mrt-cartoon.jpg" alt="MRT train" className={styles.headerImg} />
          <div className={styles.headline}>You finished!</div>
          <div className={styles.subline}>You found {total} station{total !== 1 ? "s" : ""}</div>
        </div>

        {/* Stats grid */}
        <div className={styles.grid}>
          <div className={`${styles.cell} ${styles.cellGreen}`}>
            <div className={styles.cellNumber}>{guessStats.inOneTry}</div>
            <div className={styles.cellLabel}>1st try</div>
          </div>
          <div className={`${styles.cell} ${styles.cellYellow}`}>
            <div className={styles.cellNumber}>{guessStats.inTwoTries}</div>
            <div className={styles.cellLabel}>2nd try</div>
          </div>
          <div className={`${styles.cell} ${styles.cellOrange}`}>
            <div className={styles.cellNumber}>{guessStats.inThreeTries}</div>
            <div className={styles.cellLabel}>3rd try</div>
          </div>
          <div className={`${styles.cell} ${styles.cellRed}`}>
            <div className={styles.cellNumber}>{guessStats.afterThreeTries}</div>
            <div className={styles.cellLabel}>Missed</div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onPlayAgain} type="button">
            Play again
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate("/")} type="button">
            Home
          </button>
        </div>
      </div>
    </Modal>
  );
}
