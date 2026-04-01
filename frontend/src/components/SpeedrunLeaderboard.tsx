/**
 * SpeedrunLeaderboard — Convex-backed
 *
 * Flow:
 *  1. Fetch top 10 scores via Convex query.
 *  2. If player qualifies, show submit form.
 *  3. After submit (or if not qualifying), show the top-10 board.
 */

import React, { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import styles from "../css/SpeedrunLeaderboard.module.css";
import { formatMs } from "../pages/Game";
import config from "../config/constants.json";

Modal.setAppElement("#root");

const CONVEX_URL = (config as any).convexUrl as string;
const TOP_LIMIT = (config as any).speedrun.topScoresLimit as number;

interface ScoreRow {
  id: string;
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
  const client = useRef(CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null);

  useEffect(() => {
    if (!isOpen) return;
    setPhase("loading");
    setUsername("");
    setSubmitError("");

    if (!client.current) { setPhase("error"); return; }

    client.current.query(api.scores.getTop, { limit: TOP_LIMIT })
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
    if (!client.current) { setSubmitError("Backend unavailable"); return; }
    setPhase("submitting");
    try {
      await client.current.mutation(api.scores.submit, { username: name, score_ms: playerTimeMs });
      const rows = await client.current.query(api.scores.getTop, { limit: TOP_LIMIT });
      setTopScores(rows);
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
