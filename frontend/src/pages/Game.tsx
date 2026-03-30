import { useCallback, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import FixedBar from "../components/FixedBar";
import MrtMapController from "../components/MrtMapController";
import GameFinishModal from "../components/GameFinishModal";
import { getAllStations, sampleStations } from "../data/stations";
import styles from "../css/Game.module.css";

export enum GameType {
  QUICKGAME,
  SINGAPORETOUR,
}

interface GameProps {
  gameType: GameType;
}

interface GuessStats {
  inOneTry: number;
  inTwoTries: number;
  inThreeTries: number;
  afterThreeTries: number;
}

const TRIES_PER_STATION = 3;
const QUICKGAME_STATION_COUNT = 10;

function getInitialStations(gameType: GameType): string[] {
  return gameType === GameType.QUICKGAME
    ? sampleStations(QUICKGAME_STATION_COUNT)
    : getAllStations();
}

export default function Game({ gameType }: GameProps) {
  const [unseenStations, setUnseenStations] = useState<string[]>([]);
  const [currentStation, setCurrentStation] = useState("");
  const [clickedStations, setClickedStations] = useState<string[]>([]);
  const [newlyCorrectStation, setNewlyCorrectStation] = useState("");
  const [tries, setTries] = useState(TRIES_PER_STATION);
  const [currentScore, setCurrentScore] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [showGreenFlash, setShowGreenFlash] = useState(false);
  const [guessStats, setGuessStats] = useState<GuessStats>({
    inOneTry: 0,
    inTwoTries: 0,
    inThreeTries: 0,
    afterThreeTries: 0,
  });

  // ── Derived display values ─────────────────────────────────────────────────

  const getStationsLeft = (): string => {
    const found = clickedStations.length;
    const total = found + unseenStations.length + (currentStation ? 1 : 0);
    return `${found}/${total}`;
  };

  const getScore = (): string => {
    const found = clickedStations.length;
    if (found === 0) return "0.0";
    // Normalised 0–1: average score per station (floor to 1dp)
    // 1 try = 1.0, 2 tries = 0.6, 3 tries = 0.3, failed = 0.0
    const normalized = currentScore / (found * TRIES_PER_STATION);
    return String(Math.floor(normalized * 10) / 10);
  };

  // ── Station progression ────────────────────────────────────────────────────

  const getNewStation = useCallback(() => {
    setUnseenStations((prev) => {
      if (prev.length === 0) return prev;
      const idx = Math.floor(Math.random() * prev.length);
      setCurrentStation(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const recordGuess = (triesUsed: number) => {
    const t = Math.max(0, triesUsed);
    setGuessStats((prev) => ({
      inOneTry:          prev.inOneTry          + (t === 3 ? 1 : 0),
      inTwoTries:        prev.inTwoTries         + (t === 2 ? 1 : 0),
      inThreeTries:      prev.inThreeTries       + (t === 1 ? 1 : 0),
      afterThreeTries:   prev.afterThreeTries    + (t === 0 ? 1 : 0),
    }));
  };

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onCorrectClick = (station: string, triesRemaining: number) => {
    recordGuess(triesRemaining);
    setCurrentScore((prev) => prev + Math.max(0, triesRemaining));
    setClickedStations((prev) => [...prev, station]);
    setNewlyCorrectStation(station);
    setTries(TRIES_PER_STATION);
    setShowGreenFlash(true);
    setTimeout(() => setShowGreenFlash(false), 500);
    // getNewStation reads unseenStations from its own closure — call after state flush
    getNewStation();
  };

  const onWrongClick = () => {
    setTries((prev) => prev - 1);
  };

  const restartGame = () => {
    // Hide all station name labels revealed in the SVG
    document.querySelectorAll<HTMLElement>('[id$="_Text"]').forEach((el) => {
      el.style.display = "none";
    });
    setClickedStations([]);
    setCurrentStation("");
    setNewlyCorrectStation("");
    setTries(TRIES_PER_STATION);
    setCurrentScore(0);
    setModalOpen(false);
    setGuessStats({ inOneTry: 0, inTwoTries: 0, inThreeTries: 0, afterThreeTries: 0 });
    setUnseenStations(getInitialStations(gameType));
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  // Initialise stations on mount / game type change
  useEffect(() => {
    setUnseenStations(getInitialStations(gameType));
  }, [gameType]);

  // Advance to the next station whenever the current one is cleared
  useEffect(() => {
    if (!currentStation && unseenStations.length > 0) {
      getNewStation();
    }
  }, [currentStation, getNewStation, unseenStations]);

  // End the game when all stations have been attempted
  useEffect(() => {
    if (clickedStations.length > 0 && unseenStations.length === 0 && !currentStation) {
      setModalOpen(true);
    }
  }, [clickedStations.length, currentStation, unseenStations.length]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.GameContainer}>
      {showGreenFlash && <div className={styles.greenFlash} aria-hidden="true" />}
      <MrtMapController
        onCorrectClick={onCorrectClick}
        onWrongClick={onWrongClick}
        currentStation={currentStation}
        newlyCorrectStation={newlyCorrectStation}
        tries={tries}
      />
      <FixedBar
        currentStation={currentStation}
        tries={tries}
        getScore={getScore}
        getStationsLeft={getStationsLeft}
        setModalOpen={setModalOpen}
        restartGame={restartGame}
      />
      <GameFinishModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        guessStats={guessStats}
        getScore={getScore}
      />
      <Analytics />
    </div>
  );
}
