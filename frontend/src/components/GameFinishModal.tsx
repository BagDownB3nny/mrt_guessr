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

function getTierMessage(score: number, maxScore: number): string {
  if (maxScore === 0) return "Are you really Singaporean?";
  const pct = score / maxScore;
  if (pct === 1)       return "You are the MRT map!";
  if (pct >= 13 / 15)  return "You basically live on the MRT";
  if (pct >= 11 / 15)  return "Impressive. Most people can't do this";
  if (pct >= 8 / 15)   return "Not bad, you know your way around town";
  if (pct >= 4 / 15)   return "Stick to Google Maps";
  return "Are you really Singaporean?";
}

export default function GameFinishModal({ modalOpen, setModalOpen, guessStats, onPlayAgain }: Props) {
  const navigate = useNavigate();

  const score = guessStats.inOneTry * 3 + guessStats.inTwoTries * 2 + guessStats.inThreeTries * 1;
  const total = guessStats.inOneTry + guessStats.inTwoTries + guessStats.inThreeTries + guessStats.afterThreeTries;
  const maxScore = total * 3;
  const tierMessage = getTierMessage(score, maxScore);

  return (
    <Modal
      isOpen={modalOpen}
      contentLabel="Game results"
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
      onRequestClose={() => setModalOpen(false)}
    >
      <div className={styles.modalContainer}>
        {/* Tier message headline */}
        <div className={styles.header}>
          <div className={styles.headline}>{tierMessage}</div>
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
