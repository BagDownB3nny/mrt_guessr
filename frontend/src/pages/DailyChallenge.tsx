/**
 * Daily Challenge page.
 *
 * Fetches today's 5 stations from the Convex backend.
 * Cookie-gates to one attempt per day.
 * Reuses the same game mechanics as Quickplay.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import FixedBar from "../components/FixedBar";
import MrtMapController from "../components/MrtMapController";
import GameFinishModal from "../components/GameFinishModal";
import InstructionCard, { hasSeenInstructions } from "../components/InstructionCard";
import HintButton from "../components/HintButton";
import styles from "../css/Game.module.css";
import config from "../config/constants.json";

const CONVEX_URL = (config as any).convexUrl as string | undefined;
const TRIES_PER_STATION = config.gameplay.triesPerStation;
const DAILY_COOKIE_PREFIX = "mrt_daily_";

interface GuessStats {
  inOneTry: number;
  inTwoTries: number;
  inThreeTries: number;
  afterThreeTries: number;
  foundStations: string[];
  missedStations: string[];
}

// ── Cookie helpers ─────────────────────────────────────────────────────────

function todaySGT(): string {
  const now = new Date();
  const sgt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return sgt.toISOString().slice(0, 10);
}

function getDailyCookieValue(): string | null {
  const key = `${DAILY_COOKIE_PREFIX}${todaySGT()}`;
  const match = document.cookie.split(";").find((c) => c.trim().startsWith(`${key}=`));
  return match ? match.split("=").slice(1).join("=").trim() : null;
}

function setDailyCookie(value: string): void {
  const date = todaySGT();
  const key = `${DAILY_COOKIE_PREFIX}${date}`;
  // Expires at midnight SGT (midnight UTC+8 = 16:00 UTC next day)
  const tomorrow = new Date(date + "T16:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  document.cookie = `${key}=${value}; expires=${tomorrow.toUTCString()}; path=/; SameSite=Lax`;
}

// ── Component ──────────────────────────────────────────────────────────────

type Phase = "loading" | "already-played" | "playing" | "error";

export default function DailyChallenge() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("loading");
  const [todayStations, setTodayStations] = useState<string[]>([]);
  const [alreadyPlayedResult, setAlreadyPlayedResult] = useState<string | null>(null);

  // Game state (mirrors Game.tsx)
  const [unseenStations, setUnseenStations] = useState<string[]>([]);
  const [currentStation, setCurrentStation] = useState("");
  const [clickedStations, setClickedStations] = useState<string[]>([]);
  const [newlyCorrectStation, setNewlyCorrectStation] = useState("");
  const [tries, setTries] = useState(TRIES_PER_STATION);
  const [modalOpen, setModalOpen] = useState(false);
  const [showGreenFlash, setShowGreenFlash] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [veilVisible, setVeilVisible] = useState(true);
  const [showInstructions, setShowInstructions] = useState(!hasSeenInstructions());
  const [guessStats, setGuessStats] = useState<GuessStats>({
    inOneTry: 0, inTwoTries: 0, inThreeTries: 0,
    afterThreeTries: 0, foundStations: [], missedStations: [],
  });

  // ── Load today's challenge ──────────────────────────────────────────────

  useEffect(() => {
    // Check cookie first
    const cookieVal = getDailyCookieValue();
    if (cookieVal) {
      setAlreadyPlayedResult(cookieVal);
      setPhase("already-played");
      return;
    }

    if (!CONVEX_URL) {
      console.error("CONVEX_URL is not configured in constants.json");
      setPhase("error");
      return;
    }

    console.log("Fetching daily challenge from:", CONVEX_URL);
    const client = new ConvexHttpClient(CONVEX_URL);
    (client.query as any)(api.dailyChallenge.getToday)
      .then((result: { date: string; stations: string[] } | null) => {
        console.log("Daily challenge result:", result);
        if (!result || result.stations.length === 0) {
          console.error("No stations returned or empty array");
          setPhase("error");
          return;
        }
        setTodayStations(result.stations);
        setUnseenStations(result.stations);
        setPhase("playing");
      })
      .catch((err: unknown) => {
        console.error("Failed to fetch daily challenge:", err);
        setPhase("error");
      });
  }, []);

  // ── Station progression ─────────────────────────────────────────────────

  const getNewStation = useCallback(() => {
    setUnseenStations((prev) => {
      if (prev.length === 0) { setCurrentStation(""); return prev; }
      const idx = Math.floor(Math.random() * prev.length);
      setCurrentStation(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  useEffect(() => {
    if (phase === "playing" && unseenStations.length > 0 && !currentStation) {
      getNewStation();
    }
  }, [phase, currentStation, getNewStation, unseenStations.length]);

  // ── End game ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (clickedStations.length > 0 && unseenStations.length === 0 && !currentStation) {
      const score = guessStats.inOneTry * 3 + guessStats.inTwoTries * 2 + guessStats.inThreeTries * 1;
      const max = todayStations.length * 3;
      const scoreStr = max === 0 ? "0.0" : (Math.round((score / max) * 100) / 10).toFixed(1);
      setDailyCookie(`score:${scoreStr}`);
      const delay = setTimeout(() => setModalOpen(true), config.transitions.gameEndModalDelayMs);
      return () => clearTimeout(delay);
    }
  }, [clickedStations.length, currentStation, unseenStations.length, guessStats, todayStations.length]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const recordGuess = (station: string, triesUsed: number) => {
    const t = Math.max(0, triesUsed);
    const isFound = t > 0;
    setGuessStats((prev) => ({
      inOneTry:        prev.inOneTry        + (t === 3 ? 1 : 0),
      inTwoTries:      prev.inTwoTries      + (t === 2 ? 1 : 0),
      inThreeTries:    prev.inThreeTries    + (t === 1 ? 1 : 0),
      afterThreeTries: prev.afterThreeTries + (t === 0 ? 1 : 0),
      foundStations:   isFound ? [...prev.foundStations, station] : prev.foundStations,
      missedStations:  isFound ? prev.missedStations : [...prev.missedStations, station],
    }));
  };

  const onCorrectClick = (station: string, triesRemaining: number) => {
    recordGuess(station, triesRemaining);
    setClickedStations((prev) => [...prev, station]);
    setNewlyCorrectStation(station);
    setTries(TRIES_PER_STATION);
    setShowGreenFlash(true);
    setTimeout(() => setShowGreenFlash(false), config.transitions.correctFlashMs);
    getNewStation();
  };

  const onWrongClick = (_station: string) => {
    setTries((prev) => prev - 1);
    setShowRedFlash(true);
    setTimeout(() => setShowRedFlash(false), config.transitions.wrongFlashMs);
  };

  const getStationsLeft = () => `${clickedStations.length}/${todayStations.length}`;

  const onExploreMap = () => {
    setModalOpen(false);
    document.querySelectorAll<HTMLElement>('[id$="_Text"]').forEach((el) => { el.style.display = "block"; });
  };

  // ── Loading / error / already-played states ─────────────────────────────

  if (phase === "loading") {
    return (
      <div className={styles.GameContainer}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", color: "var(--color-ink)", fontSize: "1.2rem" }}>
          Loading today's challenge…
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={styles.GameContainer}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100dvh", gap: "1rem", color: "var(--color-ink)" }}>
          <div style={{ fontSize: "1.2rem" }}>No challenge available today.</div>
          <button onClick={() => navigate("/")} style={{ padding: "0.6rem 1.4rem", border: "2px solid currentColor", borderRadius: "999px", background: "transparent", cursor: "pointer", fontSize: "1rem" }}>
            Home
          </button>
        </div>
      </div>
    );
  }

  if (phase === "already-played") {
    const scoreStr = alreadyPlayedResult?.replace("score:", "") ?? "?";
    return (
      <div className={styles.GameContainer}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100dvh", gap: "1.2rem", color: "var(--color-ink)", padding: "2rem" }}>
          <div style={{ fontSize: "1.1rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Daily Challenge</div>
          <div style={{ fontSize: "4rem", fontWeight: 800 }}>{scoreStr}<span style={{ fontSize: "1.8rem", opacity: 0.5 }}>/10</span></div>
          <div style={{ fontSize: "1rem", opacity: 0.55 }}>Come back tomorrow</div>
          <button onClick={() => navigate("/")} style={{ marginTop: "0.5rem", padding: "0.65rem 1.6rem", border: "2px solid currentColor", borderRadius: "999px", background: "transparent", cursor: "pointer", fontSize: "1rem", fontWeight: 700 }}>
            Home
          </button>
        </div>
      </div>
    );
  }

  // ── Main game ────────────────────────────────────────────────────────────

  return (
    <>
      <div className={styles.GameContainer}>
        {showGreenFlash && <div className={styles.greenFlash} aria-hidden="true" />}
        {showRedFlash && <div className={styles.redFlash} aria-hidden="true" />}
        <MrtMapController
          onCorrectClick={onCorrectClick}
          onWrongClick={onWrongClick}
          currentStation={currentStation}
          newlyCorrectStation={newlyCorrectStation}
          tries={tries}
          onMapReady={() => { if (!showInstructions) setVeilVisible(false); }}
          blocked={modalOpen}
        />
        <div
          className={`${styles.seaVeil} ${veilVisible ? "" : styles.seaVeilHidden} ${showInstructions ? styles.seaVeilShort : ""}`}
          aria-hidden="true"
        />
        {showInstructions && (
          <InstructionCard onStart={() => { setShowInstructions(false); setVeilVisible(false); }} />
        )}
        <FixedBar
          currentStation={currentStation}
          tries={tries}
          getStationsLeft={getStationsLeft}
          setModalOpen={setModalOpen}
          restartGame={() => navigate("/")}
          minimal={showInstructions}
        />
        <GameFinishModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          guessStats={guessStats}
          onPlayAgain={() => navigate("/")}
          onExploreMap={onExploreMap}
        />
      </div>
      {!modalOpen && !showInstructions && (
        <HintButton currentStation={currentStation} />
      )}
    </>
  );
}
