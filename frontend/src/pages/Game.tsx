import { useCallback, useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import FixedBar from "../components/FixedBar";
import MrtMapController from "../components/MrtMapController";
import GameFinishModal from "../components/GameFinishModal";
import TutorialOverlay, { TutorialHighlightTarget } from "../components/TutorialOverlay";
import HintButton from "../components/HintButton";
import { getAllStations, sampleStations } from "../data/stations";
import styles from "../css/Game.module.css";
import config from "../config/constants.json";

export enum GameType {
  QUICKGAME,
  SINGAPORETOUR,
  SPEEDRUN,
  DAILY,
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
const TUTORIAL_STATIONS_DEFAULT = ["Dhoby Ghaut", "Buona Vista", "Hume", "Siglap", "Gul Circle"] as const;
const TUTORIAL_STATIONS_THREE_WRONG = ["Dhoby Ghaut", "Buona Vista", "Hume", "Woodlands", "Rochor"] as const;
const TUTORIAL_EVENTS_COOKIE = "mrt_guessr_tutorial_events";
const TUTORIAL_COOKIE_DAYS = 365;

type TutorialEventKey =
  | "intro_find_station"
  | "found_score"
  | "found_next_station"
  | "wrong_once_lives"
  | "wrong_twice_hints"
  | "wrong_thrice_reveal";

function readTutorialEventsCookie(): Record<string, boolean> {
  const raw = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${TUTORIAL_EVENTS_COOKIE}=`));
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw.slice(TUTORIAL_EVENTS_COOKIE.length + 1)));
  } catch {
    return {};
  }
}

function writeTutorialEventsCookie(events: Record<string, boolean>): void {
  const expires = new Date(Date.now() + TUTORIAL_COOKIE_DAYS * 86400000).toUTCString();
  document.cookie = `${TUTORIAL_EVENTS_COOKIE}=${encodeURIComponent(JSON.stringify(events))}; expires=${expires}; path=/; SameSite=Lax`;
}

function getInitialStations(gameType: GameType, useTutorial: boolean): string[] {
  if (useTutorial && gameType === GameType.QUICKGAME) return [...TUTORIAL_STATIONS_DEFAULT];
  if (gameType === GameType.QUICKGAME) return sampleStations(QUICKGAME_STATION_COUNT);
  if (gameType === GameType.SPEEDRUN)  return sampleStations(SPEEDRUN_STATION_COUNT);
  return getAllStations();
}

function getTutorialRemainingStationsAfterThreeWrong(currentStation: string): string[] {
  const idx = TUTORIAL_STATIONS_THREE_WRONG.indexOf(currentStation as (typeof TUTORIAL_STATIONS_THREE_WRONG)[number]);
  return idx >= 0 ? [...TUTORIAL_STATIONS_THREE_WRONG.slice(idx + 1)] : [];
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
  // Tutorial scaffold
  const [tutorialActive] = useState(gameType === GameType.QUICKGAME);
  const [tutorialHighlightTarget, setTutorialHighlightTarget] = useState<TutorialHighlightTarget>("station-card");
  const [tutorialInstruction, setTutorialInstruction] = useState("Find Dhoby Ghaut");
  const [tutorialThreeWrongTriggered, setTutorialThreeWrongTriggered] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [tutorialPendingStep, setTutorialPendingStep] = useState<"none" | "found_score" | "found_next_station">("none");
  const [tutorialSeenEvents, setTutorialSeenEvents] = useState<Record<string, boolean>>(() => readTutorialEventsCookie());
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

  const markTutorialEventSeen = useCallback((event: TutorialEventKey) => {
    setTutorialSeenEvents((prev) => {
      if (prev[event]) return prev;
      const next = { ...prev, [event]: true };
      writeTutorialEventsCookie(next);
      return next;
    });
  }, []);

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
    setTutorialVisible(false);
    setTutorialPendingStep("none");
    setTutorialHighlightTarget("station-card");
    setTutorialInstruction(`Find ${TUTORIAL_STATIONS_DEFAULT[0]}`);
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

  // Tutorial: intro card only once ever
  useEffect(() => {
    if (!tutorialActive || !currentStation || tutorialPendingStep !== "none" || tries <= 0) return;
    if (tutorialSeenEvents.intro_find_station) return;
    setTutorialHighlightTarget("station-card");
    setTutorialInstruction(`Find ${currentStation}`);
    setTutorialVisible(true);
  }, [currentStation, tries, tutorialActive, tutorialPendingStep, tutorialSeenEvents.intro_find_station]);

  // Tutorial: first/second wrong clicks guide lives/hints only once ever
  useEffect(() => {
    if (!tutorialActive || !currentStation || tries === TRIES_PER_STATION || tries <= 0) return;
    if (tries === 2 && !tutorialSeenEvents.wrong_once_lives) {
      setTutorialHighlightTarget("lives");
      setTutorialInstruction("3 tries — these show how many guesses you have left.");
      setTutorialVisible(true);
      return;
    }
    if (tries === 1 && !tutorialSeenEvents.wrong_twice_hints) {
      setTutorialHighlightTarget("hints");
      setTutorialInstruction("Hints show up after wrong tries.");
      setTutorialVisible(true);
    }
  }, [tries, currentStation, tutorialActive, tutorialSeenEvents.wrong_once_lives, tutorialSeenEvents.wrong_twice_hints]);

  // Tutorial: 3 wrongs branch after pan/reveal delay, only once ever
  useEffect(() => {
    if (!tutorialActive || !currentStation || tries > 0) return;
    if (!tutorialThreeWrongTriggered) {
      setTutorialThreeWrongTriggered(true);
      setUnseenStations(getTutorialRemainingStationsAfterThreeWrong(currentStation));
    }
    if (tutorialSeenEvents.wrong_thrice_reveal) return;
    const delayMs = config.transitions.stationPanDelayMs + config.transitions.revealCircleDelayMs + 350;
    const timeout = setTimeout(() => {
      setTutorialHighlightTarget("correct-station");
      setTutorialInstruction(`${currentStation} is actually here! Tap on ${currentStation} to proceed!`);
      setTutorialVisible(true);
    }, delayMs);
    return () => clearTimeout(timeout);
  }, [tries, currentStation, tutorialActive, tutorialThreeWrongTriggered, tutorialSeenEvents.wrong_thrice_reveal]);

  // Tutorial: when user taps the revealed correct station, dismiss that card without Continue
  useEffect(() => {
    if (!tutorialActive || !newlyCorrectStation) return;
    if (tutorialHighlightTarget === "correct-station") {
      markTutorialEventSeen("wrong_thrice_reveal");
      setTutorialVisible(false);
    }
    if (!tutorialSeenEvents.found_score) {
      setTutorialPendingStep("found_score");
      return;
    }
    if (!tutorialSeenEvents.found_next_station) {
      setTutorialPendingStep("found_next_station");
    }
  }, [newlyCorrectStation, tutorialActive, tutorialHighlightTarget, tutorialSeenEvents.found_score, tutorialSeenEvents.found_next_station, markTutorialEventSeen]);

  useEffect(() => {
    if (!tutorialActive || tutorialPendingStep !== "found_score") return;
    setTutorialHighlightTarget("score");
    setTutorialInstruction(`You’ve found ${clickedStations.length}/${totalStations} stations.`);
    setTutorialVisible(true);
  }, [tutorialActive, tutorialPendingStep, clickedStations.length, totalStations]);

  useEffect(() => {
    if (!tutorialActive || tutorialVisible || tutorialPendingStep !== "found_next_station") return;
    if (currentStation) {
      setTutorialHighlightTarget("station-card");
      setTutorialInstruction("You get a new station after finding the previous one.");
      setTutorialVisible(true);
    }
  }, [tutorialActive, tutorialVisible, tutorialPendingStep, currentStation]);

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
        onMapReady={() => { setVeilVisible(false); }}
        blocked={modalOpen}
      />
      {/* Entry veil: sea colour, fades out after map loads. */}
      <div
        className={`${styles.seaVeil} ${veilVisible ? "" : styles.seaVeilHidden}`}
        aria-hidden="true"
      />
      <TutorialOverlay
        visible={tutorialActive && !modalOpen && tutorialVisible}
        highlightTarget={tutorialHighlightTarget}
        instruction={tutorialInstruction}
        showContinue={tutorialHighlightTarget !== "correct-station"}
        onContinue={() => {
          if (tutorialHighlightTarget === "station-card") {
            if (!tutorialSeenEvents.intro_find_station) {
              markTutorialEventSeen("intro_find_station");
            } else if (tutorialPendingStep === "found_next_station") {
              markTutorialEventSeen("found_next_station");
              setTutorialPendingStep("none");
            }
          } else if (tutorialHighlightTarget === "lives") {
            markTutorialEventSeen("wrong_once_lives");
          } else if (tutorialHighlightTarget === "hints") {
            markTutorialEventSeen("wrong_twice_hints");
          } else if (tutorialHighlightTarget === "score") {
            markTutorialEventSeen("found_score");
            if (!tutorialSeenEvents.found_next_station) {
              setTutorialPendingStep("found_next_station");
            } else {
              setTutorialPendingStep("none");
            }
          }
          setTutorialVisible(false);
        }}
      />
      <FixedBar
        currentStation={currentStation}
        tries={tries}
        getStationsLeft={getStationsLeft}
        setModalOpen={setModalOpen}
        restartGame={restartGame}
        minimal={false}
        highlightStationCard={tutorialActive && tutorialHighlightTarget === "station-card"}
        highlightLives={tutorialActive && tutorialHighlightTarget === "lives"}
        highlightScore={tutorialActive && tutorialHighlightTarget === "score"}
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
    {!isSpeedrun && !modalOpen && (
      <HintButton
        currentStation={currentStation}
        triesLeft={tries}
        triesPerStation={TRIES_PER_STATION}
        highlighted={tutorialActive && tutorialHighlightTarget === "hints"}
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
