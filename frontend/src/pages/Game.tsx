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
const QUICKGAME_STATION_COUNT = 5;

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
  const [modalOpen, setModalOpen] = useState(false);
  const [totalStations, setTotalStations] = useState(0);
  const [showGreenFlash, setShowGreenFlash] = useState(false);
  // Sea-colour entry veil — starts opaque, fades out once the SVG is ready
  const [veilVisible, setVeilVisible] = useState(true);
  const [guessStats, setGuessStats] = useState<GuessStats>({
    inOneTry: 0,
    inTwoTries: 0,
    inThreeTries: 0,
    afterThreeTries: 0,
  });

  // ── Derived display values ─────────────────────────────────────────────────

  const getStationsLeft = (): string =>
    `${clickedStations.length}/${totalStations}`;

  // ── Station progression ────────────────────────────────────────────────────

  const getNewStation = useCallback(() => {
    setUnseenStations((prev) => {
      if (prev.length === 0) {
        // No more stations — clear current so the game-end effect fires
        setCurrentStation("");
        return prev;
      }
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
    setModalOpen(false);
    setGuessStats({ inOneTry: 0, inTwoTries: 0, inThreeTries: 0, afterThreeTries: 0 });
    const stations = getInitialStations(gameType);
    setTotalStations(stations.length);
    setUnseenStations(stations);
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  // Initialise stations on mount / game type change
  useEffect(() => {
    const stations = getInitialStations(gameType);
    setTotalStations(stations.length);
    setUnseenStations(stations);
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
        onMapReady={() => setVeilVisible(false)}
      />
      {/* Entry veil: sea colour, fades out after map loads */}
      <div className={`${styles.seaVeil} ${veilVisible ? "" : styles.seaVeilHidden}`} aria-hidden="true" />
      <FixedBar
        currentStation={currentStation}
        tries={tries}
        getStationsLeft={getStationsLeft}
        setModalOpen={setModalOpen}
        restartGame={restartGame}
      />
      <GameFinishModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        guessStats={guessStats}
        onPlayAgain={restartGame}
      />
      <Analytics />
    </div>
  );
}
