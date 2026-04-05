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
import HintButton from "../components/HintButton";
import styles from "../css/Game.module.css";
import config from "../config/constants.json";
import { applyGuessToStats, createEmptyGuessStats, GuessStats, setAllStationLabelsVisible } from "../gameplay/shared";

const CONVEX_URL = (config as any).convexUrl as string | undefined;
const TRIES_PER_STATION = config.gameplay.triesPerStation;
const DAILY_COOKIE_PREFIX = "mrt_daily_";

// ── Cookie helpers ─────────────────────────────────────────────────────────

function todaySGT(): string {
  const now = new Date();
  const sgt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return sgt.toISOString().slice(0, 10);
}

interface DailyCookieData {
  score: string;         // e.g. "8.3"
  inOneTry: number;
  inTwoTries: number;
  inThreeTries: number;
  afterThreeTries: number;
  foundStations: string[];
  missedStations: string[];
}

function getDailyCookieData(): DailyCookieData | null {
  const key = `${DAILY_COOKIE_PREFIX}${todaySGT()}`;
  const match = document.cookie.split(";").find((c) => c.trim().startsWith(`${key}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=").trim()));
  } catch {
    return null;
  }
}

function setDailyCookie(stats: GuessStats, scoreStr: string): void {
  const date = todaySGT();
  const key = `${DAILY_COOKIE_PREFIX}${date}`;
  const data: DailyCookieData = {
    score: scoreStr,
    inOneTry: stats.inOneTry,
    inTwoTries: stats.inTwoTries,
    inThreeTries: stats.inThreeTries,
    afterThreeTries: stats.afterThreeTries,
    foundStations: stats.foundStations,
    missedStations: stats.missedStations,
  };
  const tomorrow = new Date(date + "T16:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  document.cookie = `${key}=${encodeURIComponent(JSON.stringify(data))}; expires=${tomorrow.toUTCString()}; path=/; SameSite=Lax`;
}

// ── Component ──────────────────────────────────────────────────────────────

type Phase = "loading" | "already-played" | "playing" | "error";

export default function DailyChallenge() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("loading");
  const [todayStations, setTodayStations] = useState<string[]>([]);
  const [savedResult, setSavedResult] = useState<DailyCookieData | null>(null);

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
  const [guessStats, setGuessStats] = useState<GuessStats>(createEmptyGuessStats);

  // ── Load today's challenge ──────────────────────────────────────────────

  useEffect(() => {
    // Check cookie first — show results, but allow replay
    const saved = getDailyCookieData();
    if (saved) {
      setSavedResult(saved);
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
      setDailyCookie(guessStats, scoreStr);
      const delay = setTimeout(() => setModalOpen(true), config.transitions.gameEndModalDelayMs);
      return () => clearTimeout(delay);
    }
  }, [clickedStations.length, currentStation, unseenStations.length, guessStats, todayStations.length]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const recordGuess = (station: string, triesUsed: number) => {
    setGuessStats((prev) => applyGuessToStats(prev, station, triesUsed));
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

  const handleReplay = useCallback(() => {
    if (!CONVEX_URL) { setPhase("error"); return; }
    setSavedResult(null);
    setPhase("loading");
    const client = new ConvexHttpClient(CONVEX_URL);
    (client.query as any)(api.dailyChallenge.getToday)
      .then((result: { date: string; stations: string[] } | null) => {
        if (!result || result.stations.length === 0) { setPhase("error"); return; }
        setTodayStations(result.stations);
        setUnseenStations(result.stations);
        setClickedStations([]);
        setCurrentStation("");
        setNewlyCorrectStation("");
        setTries(TRIES_PER_STATION);
        setGuessStats(createEmptyGuessStats());
        setModalOpen(false);
        setVeilVisible(true);
        setPhase("playing");
      })
      .catch(() => setPhase("error"));
  }, []);

  const onExploreMap = () => {
    setModalOpen(false);
    setAllStationLabelsVisible(true);
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

  if (phase === "already-played" && savedResult) {
    const statsFromCookie: GuessStats = {
      inOneTry:        savedResult.inOneTry,
      inTwoTries:      savedResult.inTwoTries,
      inThreeTries:    savedResult.inThreeTries,
      afterThreeTries: savedResult.afterThreeTries,
      foundStations:   savedResult.foundStations,
      missedStations:  savedResult.missedStations,
    };
    return (
      <div className={styles.GameContainer}>
        <GameFinishModal
          modalOpen={true}
          setModalOpen={() => navigate("/")}
          guessStats={statsFromCookie}
          onPlayAgain={handleReplay}
        />
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
          onMapReady={() => { setVeilVisible(false); }}
          blocked={modalOpen}
        />
        <div
          className={`${styles.seaVeil} ${veilVisible ? "" : styles.seaVeilHidden}`}
          aria-hidden="true"
        />
        <FixedBar
          currentStation={currentStation}
          tries={tries}
          getStationsLeft={getStationsLeft}
          setModalOpen={setModalOpen}
          restartGame={() => navigate("/")}
          minimal={false}
        />
        <GameFinishModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          guessStats={guessStats}
          onPlayAgain={() => navigate("/")}
          onExploreMap={onExploreMap}
        />
      </div>
      {!modalOpen && (
        <HintButton currentStation={currentStation} triesLeft={tries} triesPerStation={TRIES_PER_STATION} />
      )}
    </>
  );
}
