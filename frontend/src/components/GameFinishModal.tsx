import React from "react";
import Modal from "react-modal";
import styles from "../css/GameFinishModal.module.css";
import CloseButton from "react-bootstrap/CloseButton";
import "bootstrap/dist/css/bootstrap.min.css";

Modal.setAppElement("#root");

export default function GameFinishModal(props: any) {
  const {
    modalOpen,
    setModalOpen,
    stationsGuessedInOneTry,
    stationsGuessedInTwoTries,
    stationsGuessedInThreeTries,
    stationsGuessedAfterThreeTries,
    getScore,
  } = props;

  return (
    <div>
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
            <div className={styles.row}>
              <div className={styles.text}>
                Stations found in 1 try (3 points each):{" "}
              </div>
              <div className={styles.number}>{stationsGuessedInOneTry}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.text}>
                Stations found in 2 tries (2 points each):{" "}
              </div>
              <div className={styles.number}>{stationsGuessedInTwoTries}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.text}>
                Stations found in 3 tries (1 point each):{" "}
              </div>
              <div className={styles.number}>{stationsGuessedInThreeTries}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.text}>
                Stations found after 3 tries (no points):{" "}
              </div>
              <div className={styles.number}>
                {stationsGuessedAfterThreeTries}
              </div>
            </div>
          </div>
          <div className={styles.scoresRow}>
            <div className={styles.text}>Total score: </div>
            <div className={styles.number}>{getScore()}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
