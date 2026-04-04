import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { useNavigate } from "react-router-dom";
import FixedBar from "../components/FixedBar";
import MrtMapController from "../components/MrtMapController";
import GameFinishModal from "../components/GameFinishModal";
import TutorialOverlay from "../components/TutorialOverlay";
import TutorialWelcomeCard from "../components/TutorialWelcomeCard";
import HintButton from "../components/HintButton";
import { getAllStations, sampleStations } from "../data/stations";
import styles from "../css/Game.module.css";
import config from "../config/constants.json";
import { markAllTutorialEventsComplete, markTutorialEventSeen as persistTutorialEventSeen, readTutorialEventsCookie, TUTORIAL_COMPLETED_EVENT } from "../utils/tutorial";
import { advanceQueue, buildTutorialCards, consumeCompletionPending, createInitialTutorialEngineState, enqueueEvent, getActiveCard, getRevealDelayMs, shouldDismissRevealOnCorrectTap, shouldTriggerEvent, TutorialEngineState, TutorialEventKey } from "../utils/tutorialEngine";

export enum GameType {
  QUICKGAME,
  SINGAPORETOUR,
  SPEEDRUN,
  DAILY,
}

interface GameProps {
  gameType: GameType;
  tutorialMode?: boolean;
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
const TUTORIAL_STATIONS_DEFAULT = ["Dhoby Ghaut", "Buona Vista", "Hume", "Siglap", "Gul Circle"] as const;
const TUTORIAL_STATIONS_THREE_WRONG = ["Dhoby Ghaut", "Buona Vista", "Hume", "Woodlands", "Rochor"] as const;


function getInitialStations(gameType: GameType, useTutorial: boolean): string[] {
  if (useTutorial && gameType === GameType.QUICKGAME) return [...TUTORIAL_STATIONS_DEFAULT];
  if (gameType === GameType.QUICKGAME) return sampleStations(QUICKGAME_STATION_COUNT);
  if (gameType === GameType.SPEEDRUN)  return sampleStations(SPEEDRUN_STATION_COUNT);
  return getAllStations();
}

function getTutorialRemainingStationsAfterThreeWrong(currentStation: string): string[] {
  const currentIdx = TUTORIAL_STATIONS_DEFAULT.indexOf(currentStation as (typeof TUTORIAL_STATIONS_DEFAULT)[number]);
  if (currentIdx < 0) return [];

  // Before or at Hume, branch future stations fully to the alternate path.
  if (currentIdx <= 2) {
    return [...TUTORIAL_STATIONS_THREE_WRONG.slice(currentIdx + 1)];
  }

  // If the player first triggers the 3-wrong branch on Siglap, keep the alternate final stop.
  if (currentStation === "Siglap") {
    return ["Rochor"];
  }

  // Final station has no remaining follow-up.
  return [];
}

export default function Game({ gameType, tutorialMode = false }: GameProps) {
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
  const navigate = useNavigate();
  // Sea-colour entry veil — starts opaque, fades out once the SVG is ready
  const [veilVisible, setVeilVisible] = useState(true);
  // Tutorial scaffold
  const tutorialActive = tutorialMode;
  const [tutorialWelcomeVisible, setTutorialWelcomeVisible] = useState(tutorialMode);
  const tutorialText = (config as any).tutorial;
  const [tutorialThreeWrongTriggered, setTutorialThreeWrongTriggered] = useState(false);
  const [tutorialEngine, setTutorialEngine] = useState<TutorialEngineState>(createInitialTutorialEngineState());
  const [tutorialSeenEvents, setTutorialSeenEvents] = useState<Record<string, boolean>>(() => readTutorialEventsCookie());
  const activeTutorialCard = getActiveCard(tutorialEngine);
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

  const markTutorialEventSeen = useCallback((event: TutorialEventKey | typeof TUTORIAL_COMPLETED_EVENT) => {
    setTutorialSeenEvents((prev) => {
      if (prev[event]) return prev;
      const next = persistTutorialEventSeen(event);
      return { ...prev, ...next };
    });
  }, []);

  const startTutorialEvent = useCallback((event: TutorialEventKey, ctx: { currentStation: string; newlyCorrectStation: string; wrongCount: number; clickedStationsCount: number; totalStations: number; isSpeedrun: boolean; tutorialActive: boolean; revealedStation: string | null; }) => {
    if (tutorialSeenEvents[event]) return;
    const cards = buildTutorialCards(event, ctx);
    setTutorialEngine((prev) => enqueueEvent(prev, event, cards, ctx));
  }, [tutorialSeenEvents]);

  const advanceTutorialQueue = useCallback(() => {
    setTutorialEngine((prev) => {
      const doneEvent = prev.queue.length <= 1 ? prev.activeEvent : null;
      const next = advanceQueue(prev);
      if (doneEvent) markTutorialEventSeen(doneEvent);
      return next;
    });
  }, [markTutorialEventSeen]);

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
      // Use the same formula as the display tick so final time matches what was shown
      const ms = Math.floor(performance.now() - timerStartRef.current + penaltyMsRef.current);
      setFinalTimeMs(ms);
      // Freeze the display at the exact same value
      setElapsedMs(ms);
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
      if (tutorialActive) {
        setCurrentStation(prev[0]);
        return prev.slice(1);
      }
      const idx = Math.floor(Math.random() * prev.length);
      setCurrentStation(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }, [tutorialActive]);

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
      setTimeout(() => setPenaltyLabels((prev) => prev.filter((l) => l.id !== id)), config.transitions.penaltyLabelLifetimeMs);
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
    setTutorialThreeWrongTriggered(false);
    setTutorialEngine(createInitialTutorialEngineState());
    setGuessStats({ inOneTry: 0, inTwoTries: 0, inThreeTries: 0, afterThreeTries: 0, foundStations: [], missedStations: [] });
    const stations = getInitialStations(gameType, tutorialActive);
    setTotalStations(stations.length);
    setUnseenStations(stations);
    // Speedrun: start timer immediately on restart (map is already loaded)
    if (isSpeedrun) {
      setTimeout(() => startTimer(), 0);
    }
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
    const stations = getInitialStations(gameType, tutorialActive);
    setTotalStations(stations.length);
    setUnseenStations(stations);
  }, [gameType, tutorialActive]);

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
  }, [currentStation, getNewStation, unseenStations.length]);

  // End the game when all stations have been attempted (1s delay for breathing room)
  useEffect(() => {
    if (clickedStations.length > 0 && unseenStations.length === 0 && !currentStation) {
      stopTimer();
      const delay = setTimeout(() => setModalOpen(true), config.transitions.gameEndModalDelayMs);
      return () => clearTimeout(delay);
    }
  }, [clickedStations.length, currentStation, stopTimer, unseenStations.length]);

  // Tutorial event detector → raw triggers feed a small engine
  const tutorialCtx = useMemo(() => ({
    tutorialActive,
    isSpeedrun,
    currentStation,
    wrongCount: TRIES_PER_STATION - tries,
    clickedStationsCount: clickedStations.length,
    totalStations,
    newlyCorrectStation,
    revealedStation: tutorialEngine.revealedStation,
  }), [tutorialActive, isSpeedrun, currentStation, tries, clickedStations.length, totalStations, newlyCorrectStation, tutorialEngine.revealedStation]);

  useEffect(() => {
    if (shouldTriggerEvent("intro_find_station", tutorialCtx, tutorialSeenEvents, tutorialEngine)) {
      startTutorialEvent("intro_find_station", tutorialCtx);
    }
  }, [tutorialCtx, tutorialSeenEvents, tutorialEngine, startTutorialEvent]);

  useEffect(() => {
    if (shouldTriggerEvent("wrong_once_lives", tutorialCtx, tutorialSeenEvents, tutorialEngine)) {
      startTutorialEvent("wrong_once_lives", tutorialCtx);
      return;
    }
    if (shouldTriggerEvent("wrong_twice_hints", tutorialCtx, tutorialSeenEvents, tutorialEngine)) {
      startTutorialEvent("wrong_twice_hints", tutorialCtx);
    }
  }, [tutorialCtx, tutorialSeenEvents, tutorialEngine, startTutorialEvent]);

  useEffect(() => {
    if (!shouldTriggerEvent("wrong_thrice_reveal", tutorialCtx, tutorialSeenEvents, tutorialEngine)) return;
    if (!tutorialThreeWrongTriggered) {
      setTutorialThreeWrongTriggered(true);
      setUnseenStations(getTutorialRemainingStationsAfterThreeWrong(currentStation));
    }
    const timeout = setTimeout(() => startTutorialEvent("wrong_thrice_reveal", tutorialCtx), getRevealDelayMs());
    return () => clearTimeout(timeout);
  }, [tutorialCtx, tutorialSeenEvents, tutorialEngine, tutorialThreeWrongTriggered, currentStation, startTutorialEvent]);

  useEffect(() => {
    if (!shouldTriggerEvent("correct_first", tutorialCtx, tutorialSeenEvents, tutorialEngine)) return;
    startTutorialEvent("correct_first", tutorialCtx);
    markTutorialEventSeen(TUTORIAL_COMPLETED_EVENT);
  }, [tutorialCtx, tutorialSeenEvents, tutorialEngine, startTutorialEvent, markTutorialEventSeen]);

  useEffect(() => {
    if (!shouldDismissRevealOnCorrectTap(tutorialEngine, newlyCorrectStation)) return;
    markTutorialEventSeen("wrong_thrice_reveal");
    setTutorialEngine(createInitialTutorialEngineState());
  }, [tutorialEngine, newlyCorrectStation, markTutorialEventSeen]);

  useEffect(() => {
    const [nextState, completionEvent] = consumeCompletionPending(tutorialEngine);
    if (completionEvent) {
      setTutorialEngine(nextState);
      markTutorialEventSeen(completionEvent);
    }
  }, [tutorialEngine, markTutorialEventSeen]);

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
        tutorialHighlightedStation={activeTutorialCard?.target === "clicked-station" ? newlyCorrectStation : null}
        tries={tries}
        onMapReady={() => { if (!tutorialWelcomeVisible) setVeilVisible(false); }}
        blocked={modalOpen || tutorialWelcomeVisible}
      />
      {/* Entry veil: sea colour, fades out after map loads. */}
      <div
        className={`${styles.seaVeil} ${veilVisible ? "" : styles.seaVeilHidden}`}
        aria-hidden="true"
      />
      {tutorialWelcomeVisible && tutorialActive && (
        <TutorialWelcomeCard
          title={tutorialText.welcomeTitle}
          body={tutorialText.welcomeBody}
          onStart={() => {
            setTutorialWelcomeVisible(false);
            setVeilVisible(false);
          }}
          onSkip={() => {
            const next = markAllTutorialEventsComplete();
            setTutorialSeenEvents(next);
            setTutorialWelcomeVisible(false);
            setTutorialEngine(createInitialTutorialEngineState());
            setVeilVisible(false);
            navigate("/", { replace: true });
          }}
        />
      )}
      <TutorialOverlay
        visible={!modalOpen && !tutorialWelcomeVisible && tutorialEngine.visible && !!activeTutorialCard}
        highlightTarget={activeTutorialCard?.target ?? "station-card"}
        instruction={activeTutorialCard?.text ?? ""}
        clickedStationName={newlyCorrectStation}
        showContinue={activeTutorialCard?.continueable !== false}
        onContinue={advanceTutorialQueue}
      />
      <FixedBar
        currentStation={tutorialWelcomeVisible ? "" : currentStation}
        tries={tries}
        getStationsLeft={getStationsLeft}
        setModalOpen={setModalOpen}
        restartGame={restartGame}
        minimal={false}
        highlightStationCard={tutorialEngine.visible && activeTutorialCard?.target === "station-card"}
        highlightLives={tutorialEngine.visible && activeTutorialCard?.target === "lives"}
        highlightScore={tutorialEngine.visible && activeTutorialCard?.target === "score"}
      />
      <GameFinishModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        guessStats={guessStats}
        onPlayAgain={restartGame}
        onExploreMap={onExploreMap}
        finalTimeMs={isSpeedrun ? finalTimeMs : null}
        tutorialMode={tutorialActive}
      />
      <Analytics />
    </div>
    {/* Hint button — fixed portal outside GameContainer (iOS blur safety).
        Hidden during speedrun (hints would be unfair) and when modal/instructions are showing. */}
    {!isSpeedrun && !modalOpen && !tutorialWelcomeVisible && (
      <HintButton
        currentStation={currentStation}
        triesLeft={tries}
        triesPerStation={TRIES_PER_STATION}
        highlighted={tutorialEngine.visible && activeTutorialCard?.target === "hints"}
      />
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
