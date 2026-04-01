import { useCallback, useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import FixedBar from "../components/FixedBar";
import MrtMapController from "../components/MrtMapController";
import GameFinishModal from "../components/GameFinishModal";
import InstructionCard, { hasSeenInstructions } from "../components/InstructionCard";
import HintButton from "../components/HintButton";
import { getAllStations, sampleStations } from "../data/stations";
import styles from "../css/Game.module.css";
import config from "../config/constants.json";

export enum GameType {
  QUICKGAME,
  SINGAPORETOUR,
  SPEEDRUN,
}

interface GameProps {
  gameType: GameType;
}

interface GuessStats {
  inOneTry: number;
  inTwoTries: number;
  inThreeTries: number;
  afterThreeTries: number;
  foundStations: string[];
  missedStations: string[];
}

const TRIES_PER_STATION = config.gameplay.triesPerStation;

function formatMsParts(ms: number): { main: string; sub: string } {
  const m = Math.floor(ms / 60000).toString().padStart(2, "0");
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
  return {
    main: `${m}:${s}`,
    sub: `.${cs}`,
  };
}

export function formatMs(ms: number): string {
  const { main, sub } = formatMsParts(ms);
  return `${main}${sub}`;
}
const QUICKGAME_STATION_COUNT = config.gameplay.quickgameStationCount;
const SPEEDRUN_STATION_COUNT = (config.gameplay as any).speedrunStationCount ?? 20;

function getInitialStations(gameType: GameType): string[] {
  if (gameType === GameType.QUICKGAME) return sampleStations(QUICKGAME_STATION_COUNT);
  if (gameType === GameType.SPEEDRUN)  return sampleStations(SPEEDRUN_STATION_COUNT);
  return getAllStations();
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
  const [showRedFlash, setShowRedFlash] = useState(false);
  // Speedrun timer
  const timerStartRef  = useRef<number | null>(null);
  const timerRafRef    = useRef<number | null>(null);
  const penaltyMsRef   = useRef(0);   // accumulated +1s penalties (affects displayed time)
  const [elapsedMs, setElapsedMs]     = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState<number | null>(null);
  const [penaltyLabels, setPenaltyLabels] = useState<{ id: number; dx: number }[]>([]);
  const penaltyLabelKey = useRef(0);
  const isSpeedrun = gameType === GameType.SPEEDRUN;
  // Sea-colour entry veil — starts opaque, fades out once the SVG is ready
  const [veilVisible, setVeilVisible] = useState(true);
  // Instruction card — shown once for new players (cookie-gated)
  const [showInstructions, setShowInstructions] = useState(!hasSeenInstructions());
  const [guessStats, setGuessStats] = useState<GuessStats>({
    inOneTry: 0,
    inTwoTries: 0,
    inThreeTries: 0,
    afterThreeTries: 0,
    foundStations: [],
    missedStations: [],
  });

  // ── Derived display values ─────────────────────────────────────────────────

  const getStationsLeft = (): string =>
    `${clickedStations.length}/${totalStations}`;

  // ── Speedrun timer ────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (!isSpeedrun || timerStartRef.current !== null) return;
    timerStartRef.current = performance.now();
    const tick = () => {
      setElapsedMs(Math.floor(performance.now() - timerStartRef.current! + penaltyMsRef.current));
      timerRafRef.current = requestAnimationFrame(tick);
    };
    timerRafRef.current = requestAnimationFrame(tick);
  }, [isSpeedrun]);

  const stopTimer = useCallback(() => {
    if (timerRafRef.current !== null) {
      cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    }
    if (timerStartRef.current !== null) {
      const ms = Math.floor(performance.now() - timerStartRef.current + penaltyMsRef.current);
      setFinalTimeMs(ms);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => () => {
    if (timerRafRef.current !== null) cancelAnimationFrame(timerRafRef.current);
  }, []);

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

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onCorrectClick = (station: string, triesRemaining: number) => {
    startTimer();
    recordGuess(station, triesRemaining);
    setClickedStations((prev) => [...prev, station]);
    setNewlyCorrectStation(station);
    setTries(TRIES_PER_STATION);
    setShowGreenFlash(true);
    setTimeout(() => setShowGreenFlash(false), config.transitions.correctFlashMs);
    // getNewStation reads unseenStations from its own closure — call after state flush
    getNewStation();
  };

  const onWrongClick = (_stationName: string) => {
    startTimer();
    setTries((prev) => prev - 1);
    // Red edge glow
    setShowRedFlash(true);
    setTimeout(() => setShowRedFlash(false), config.transitions.wrongFlashMs);
    // Speedrun: add 1s penalty
    if (isSpeedrun) {
      penaltyMsRef.current += 1000;
      const id = ++penaltyLabelKey.current;
      const dx = (Math.random() - 0.5) * 40; // random horizontal drift in px
      setPenaltyLabels((prev) => [...prev, { id, dx }]);
      setTimeout(() => setPenaltyLabels((prev) => prev.filter((l) => l.id !== id)), 1000);
    }
  };

  const restartGame = () => {
    if (timerRafRef.current !== null) { cancelAnimationFrame(timerRafRef.current); timerRafRef.current = null; }
    timerStartRef.current = null;
    penaltyMsRef.current = 0;
    setElapsedMs(0);
    setFinalTimeMs(null);
    setPenaltyLabels([]);
    // Hide all station name labels revealed in the SVG
    document.querySelectorAll<HTMLElement>('[id$="_Text"]').forEach((el) => {
      el.style.display = "none";
    });
    setClickedStations([]);
    setCurrentStation("");
    setNewlyCorrectStation("");
    setTries(TRIES_PER_STATION);
    setModalOpen(false);
    setGuessStats({ inOneTry: 0, inTwoTries: 0, inThreeTries: 0, afterThreeTries: 0, foundStations: [], missedStations: [] });
    const stations = getInitialStations(gameType);
    setTotalStations(stations.length);
    setUnseenStations(stations);
  };

  // ── Explore map: dismiss modal, reveal all station names, unblock map ───
  const onExploreMap = () => {
    setModalOpen(false);
    // Reveal all station name labels
    document.querySelectorAll<HTMLElement>('[id$="_Text"]').forEach((el) => {
      el.style.display = "block";
    });
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  // Initialise stations on mount / game type change
  useEffect(() => {
    const stations = getInitialStations(gameType);
    setTotalStations(stations.length);
    setUnseenStations(stations);
  }, [gameType]);

  // Speedrun: start timer the moment the veil disappears
  useEffect(() => {
    if (isSpeedrun && !veilVisible) {
      startTimer();
    }
  }, [isSpeedrun, veilVisible, startTimer]);

  // Advance to the next station whenever the current one is cleared
  useEffect(() => {
    if (!currentStation && unseenStations.length > 0) {
      getNewStation();
    }
  }, [currentStation, getNewStation, unseenStations]);

  // End the game when all stations have been attempted (1s delay for breathing room)
  useEffect(() => {
    if (clickedStations.length > 0 && unseenStations.length === 0 && !currentStation) {
      stopTimer();
      const delay = setTimeout(() => setModalOpen(true), 1000);
      return () => clearTimeout(delay);
    }
  }, [clickedStations.length, currentStation, stopTimer, unseenStations.length]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
    <div className={styles.GameContainer}>
      {showGreenFlash && <div className={styles.greenFlash} aria-hidden="true" />}
      {showRedFlash && <div className={styles.redFlash} aria-hidden="true" />}
      {/* Timer capsule only — no animations inside GameContainer */}
      {isSpeedrun && (
        <div className={styles.timerOverlay} aria-live="off">
          <div className={styles.timerCapsule}>
            <span className={styles.timerMain}>{formatMsParts(elapsedMs).main}</span>
            <span className={styles.timerSub}>{formatMsParts(elapsedMs).sub}</span>
          </div>
        </div>
      )}
      <MrtMapController
        onCorrectClick={onCorrectClick}
        onWrongClick={onWrongClick}
        currentStation={currentStation}
        newlyCorrectStation={newlyCorrectStation}
        tries={tries}
        onMapReady={() => { if (!showInstructions) setVeilVisible(false); }}
        blocked={modalOpen}
      />
      {/* Entry veil: sea colour, fades out after map loads.
          During instructions, shrink so the bottom bar peeks through. */}
      <div
        className={`${styles.seaVeil} ${veilVisible ? "" : styles.seaVeilHidden} ${showInstructions ? styles.seaVeilShort : ""}`}
        aria-hidden="true"
      />
      {/* Instruction card for first-time players — sits above the veil */}
      {showInstructions && (
        <InstructionCard onStart={() => { setShowInstructions(false); setVeilVisible(false); }} />
      )}
      <FixedBar
        currentStation={currentStation}
        tries={tries}
        getStationsLeft={getStationsLeft}
        setModalOpen={setModalOpen}
        restartGame={restartGame}
        minimal={showInstructions}
      />
      <GameFinishModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        guessStats={guessStats}
        onPlayAgain={restartGame}
        onExploreMap={onExploreMap}
        finalTimeMs={isSpeedrun ? finalTimeMs : null}
      />
      <Analytics />
    </div>
    {/* Hint button — fixed portal outside GameContainer (iOS blur safety).
        Hidden during speedrun (hints would be unfair) and when modal/instructions are showing. */}
    {!isSpeedrun && !modalOpen && !showInstructions && (
      <HintButton currentStation={currentStation} />
    )}
    {/* Penalty labels rendered outside GameContainer in a fixed portal so they
        never trigger GPU re-compositing of the map layer (fixes iOS blur) */}
    {isSpeedrun && penaltyLabels.map(({ id, dx }) => (
      <span
        key={id}
        className={styles.penaltyLabelFixed}
        style={{ ["--penalty-dx" as any]: `${dx}px` }}
        aria-hidden="true"
      >+1s</span>
    ))}
    </>
  );
}
