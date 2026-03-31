/**
 * SpeedrunLeaderboard
 *
 * Shown after the end-card when the player finishes a speedrun.
 * Flow:
 *  1. Fetch top 10 scores from the backend.
 *  2. If player's time beats any score (or board has < 10 entries), show a
 *     "You made the leaderboard!" prompt and let them submit their username.
 *  3. After submission (or if they don't qualify), show the full top-10 list.
 */

import React, { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import styles from "../css/SpeedrunLeaderboard.module.css";
import { formatMs } from "../pages/Game";
import config from "../config/constants.json";

Modal.setAppElement("#root");

const API = (config as any).speedrun.apiBase as string;
const TOP_LIMIT = (config as any).speedrun.topScoresLimit as number;

interface ScoreRow {
  id: number;
  username: string;
  score_ms: number;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  playerTimeMs: number;
  onClose: () => void;
}

type Phase = "loading" | "qualify" | "submitting" | "board" | "error";

export default function SpeedrunLeaderboard({ isOpen, playerTimeMs, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [topScores, setTopScores] = useState<ScoreRow[]>([]);
  const [username, setUsername] = useState("");
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPhase("loading");
    setUsername("");
    setSubmitError("");

    fetch(`${API}/scores/speedrun/top?limit=${TOP_LIMIT}`)
      .then((r) => r.json())
      .then((rows: ScoreRow[]) => {
        setTopScores(rows);
        const qualifies =
          rows.length < TOP_LIMIT || playerTimeMs < rows[rows.length - 1].score_ms;
        setPhase(qualifies ? "qualify" : "board");
      })
      .catch(() => setPhase("error"));
  }, [isOpen, playerTimeMs]);

  useEffect(() => {
    if (phase === "qualify") inputRef.current?.focus();
  }, [phase]);

  const handleSubmit = async () => {
    const name = username.trim();
    if (!name) { setSubmitError("Enter a username"); return; }
    setPhase("submitting");
    try {
      await fetch(`${API}/scores/speedrun`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, score_ms: playerTimeMs }),
      });
      // Refresh leaderboard after submit
      const r = await fetch(`${API}/scores/speedrun/top?limit=${TOP_LIMIT}`);
      setTopScores(await r.json());
      setPhase("board");
    } catch {
      setSubmitError("Failed to submit — try again");
      setPhase("qualify");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      contentLabel="Speedrun leaderboard"
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
    >
      <div className={styles.container}>
        {phase === "loading" && (
          <div className={styles.loading}>Loading leaderboard…</div>
        )}

        {phase === "error" && (
          <>
            <div className={styles.title}>Could not load leaderboard</div>
            <button className={styles.btnPrimary} onClick={onClose}>Close</button>
          </>
        )}

        {(phase === "qualify" || phase === "submitting") && (
          <>
            <div className={styles.title}>You made the leaderboard!</div>
            <div className={styles.yourTime}>{formatMs(playerTimeMs)}</div>
            <input
              ref={inputRef}
              className={styles.nameInput}
              type="text"
              placeholder="Your name"
              maxLength={32}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setSubmitError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={phase === "submitting"}
            />
            {submitError && <div className={styles.error}>{submitError}</div>}
            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={phase === "submitting"}
            >
              {phase === "submitting" ? "Saving…" : "Submit"}
            </button>
            <button className={styles.btnSecondary} onClick={onClose}>Skip</button>
          </>
        )}

        {phase === "board" && (
          <>
            <div className={styles.title}>Top {TOP_LIMIT} Speedruns</div>
            <div className={styles.board}>
              {topScores.length === 0 ? (
                <div className={styles.empty}>No scores yet</div>
              ) : (
                topScores.map((row, i) => (
                  <div
                    key={row.id}
                    className={`${styles.boardRow} ${row.score_ms === playerTimeMs ? styles.boardRowHighlight : ""}`}
                  >
                    <span className={styles.rank}>#{i + 1}</span>
                    <span className={styles.boardName}>{row.username}</span>
                    <span className={styles.boardTime}>{formatMs(row.score_ms)}</span>
                  </div>
                ))
              )}
            </div>
            <button className={styles.btnPrimary} onClick={onClose}>Done</button>
          </>
        )}
      </div>
    </Modal>
  );
}
