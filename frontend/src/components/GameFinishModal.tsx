import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import styles from "../css/GameFinishModal.module.css";
import CloseButton from "react-bootstrap/CloseButton";
import "bootstrap/dist/css/bootstrap.min.css";

export default function GameFinishModal(props: any) {
  const {
    modalOpen,
    setModalOpen,
    stationsGuessedInOneTry,
    stationsGuessedInTwoTries,
    stationsGuessedInThreeTries,
    stationsGuessedAfterThreeTries,
  } = props;

  useEffect(() => {
    console.log(modalOpen);
  }, [modalOpen]);

  return (
    <div>
      <Modal
        isOpen={modalOpen}
        contentLabel="Example Modal"
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            borderStyle: "solid",
            borderWidth: "10px",
            borderColor: "#E53C30",
            padding: "0",
            borderRadius: "5dvh",
          },
        }}
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
              <div className={styles.text}>Stations found in 1 try: </div>
              <div className={styles.number}>{stationsGuessedInOneTry}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.text}>Stations found in 2 tries: </div>
              <div className={styles.number}>{stationsGuessedInTwoTries}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.text}>Stations found in 3 tries: </div>
              <div className={styles.number}>{stationsGuessedInThreeTries}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.text}>Stations found after 3 tries: </div>
              <div className={styles.number}>
                {stationsGuessedAfterThreeTries}
              </div>
            </div>
          </div>
          <div className={styles.scoresRow}>
            <div className={styles.text}>Total score: </div>
            <div className={styles.number}>15 / 30</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
