import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { useNavigate } from "react-router-dom";
import FixedBar from "../components/FixedBar";
import MrtMapController from "../components/MrtMapController";
import GameFinishModal from "../components/GameFinishModal";
import TutorialOverlay from "../components/TutorialOverlay";
import TutorialWelcomeCard from "../components/TutorialWelcomeCard";
import HintButton from "../components/HintButton";
import styles from "../css/Game.module.css";
import config from "../config/constants.json";
import { markAllTutorialEventsComplete, markTutorialEventSeen as persistTutorialEventSeen, readTutorialEventsCookie, TUTORIAL_COMPLETED_EVENT } from "../utils/tutorial";
import { advanceQueue, buildTutorialCards, consumeCompletionPending, createInitialTutorialEngineState, enqueueEvent, getActiveCard, getRevealDelayMs, shouldDismissRevealOnCorrectTap, shouldTriggerEvent, TutorialEngineState, TutorialEventKey } from "../utils/tutorialEngine";
import { applyGuessToStats, createEmptyGuessStats, GuessStats, setAllStationLabelsVisible } from "./shared";
import { getStandardGameModeConfig, getTutorialRemainingStationsAfterThreeWrong, StandardGameMode } from "./standardGameConfig";

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

interface Props {
  mode: StandardGameMode;
}

export default function StandardGamePage({ mode }: Props) {
  const modeConfig = useMemo(() => getStandardGameModeConfig(mode), [mode]);
  const navigate = useNavigate();
  const tutorialText = (config as any).tutorial;
  const { isSpeedrun, tutorialMode } = modeConfig;

  const [unseenStations, setUnseenStations] = useState<string[]>([]);
  const [currentStation, setCurrentStation] = useState("");
  const [clickedStations, setClickedStations] = useState<string[]>([]);
  const [newlyCorrectStation, setNewlyCorrectStation] = useState("");
  const [tries, setTries] = useState(TRIES_PER_STATION);
  const [modalOpen, setModalOpen] = useState(false);
  const [totalStations, setTotalStations] = useState(0);
  const [showGreenFlash, setShowGreenFlash] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const timerStartRef = useRef<number | null>(null);
  const timerRafRef = useRef<number | null>(null);
  const penaltyMsRef = useRef(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState<number | null>(null);
  const [penaltyLabels, setPenaltyLabels] = useState<{ id: number; dx: number }[]>([]);
  const penaltyLabelKey = useRef(0);
  const [veilVisible, setVeilVisible] = useState(true);
  const [tutorialWelcomeVisible, setTutorialWelcomeVisible] = useState(tutorialMode);
  const [tutorialThreeWrongTriggered, setTutorialThreeWrongTriggered] = useState(false);
  const [tutorialAnchorRect, setTutorialAnchorRect] = useState<DOMRect | null>(null);
  const [tutorialEngine, setTutorialEngine] = useState<TutorialEngineState>(createInitialTutorialEngineState());
  const [tutorialSeenEvents, setTutorialSeenEvents] = useState<Record<string, boolean>>(() => readTutorialEventsCookie());
  const activeTutorialCard = getActiveCard(tutorialEngine);
  const [guessStats, setGuessStats] = useState<GuessStats>(createEmptyGuessStats);

  const getStationsLeft = (): string => `${clickedStations.length}/${totalStations}`;

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
      setElapsedMs(ms);
    }
  }, []);

  useEffect(() => () => {
    if (timerRafRef.current !== null) cancelAnimationFrame(timerRafRef.current);
  }, []);

  const getNewStation = useCallback(() => {
    setUnseenStations((prev) => {
      if (prev.length === 0) {
        setCurrentStation("");
        return prev;
      }
      if (tutorialMode) {
        setCurrentStation(prev[0]);
        return prev.slice(1);
      }
      const idx = Math.floor(Math.random() * prev.length);
      setCurrentStation(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }, [tutorialMode]);

  const recordGuess = useCallback((station: string, triesUsed: number) => {
    setGuessStats((prev) => applyGuessToStats(prev, station, triesUsed));
  }, []);

  const onCorrectClick = useCallback((station: string, triesRemaining: number) => {
    startTimer();
    recordGuess(station, triesRemaining);
    setClickedStations((prev) => [...prev, station]);
    setNewlyCorrectStation(station);
    setTries(TRIES_PER_STATION);
    setShowGreenFlash(true);
    setTimeout(() => setShowGreenFlash(false), config.transitions.correctFlashMs);
    getNewStation();
  }, [getNewStation, recordGuess, startTimer]);

  const onWrongClick = useCallback((_stationName: string) => {
    startTimer();
    setTries((prev) => prev - 1);
    setShowRedFlash(true);
    setTimeout(() => setShowRedFlash(false), config.transitions.wrongFlashMs);
    if (isSpeedrun) {
      penaltyMsRef.current += 1000;
      const id = ++penaltyLabelKey.current;
      const dx = (Math.random() - 0.5) * 40;
      setPenaltyLabels((prev) => [...prev, { id, dx }]);
      setTimeout(() => setPenaltyLabels((prev) => prev.filter((l) => l.id !== id)), config.transitions.penaltyLabelLifetimeMs);
    }
  }, [isSpeedrun, startTimer]);

  const resetStandardGame = useCallback(() => {
    if (timerRafRef.current !== null) {
      cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    }
    timerStartRef.current = null;
    penaltyMsRef.current = 0;
    setElapsedMs(0);
    setFinalTimeMs(null);
    setPenaltyLabels([]);
    setAllStationLabelsVisible(false);
    setClickedStations([]);
    setCurrentStation("");
    setNewlyCorrectStation("");
    setTries(TRIES_PER_STATION);
    setModalOpen(false);
    setTutorialThreeWrongTriggered(false);
    setTutorialEngine(createInitialTutorialEngineState());
    setGuessStats(createEmptyGuessStats());
    const stations = modeConfig.getInitialStations();
    setTotalStations(stations.length);
    setUnseenStations(stations);
    if (isSpeedrun) {
      setTimeout(() => startTimer(), 0);
    }
  }, [isSpeedrun, modeConfig, startTimer]);

  const onExploreMap = useCallback(() => {
    setModalOpen(false);
    setAllStationLabelsVisible(true);
  }, []);

  useEffect(() => {
    const stations = modeConfig.getInitialStations();
    setTotalStations(stations.length);
    setUnseenStations(stations);
    setCurrentStation("");
    setClickedStations([]);
    setNewlyCorrectStation("");
    setTries(TRIES_PER_STATION);
    setModalOpen(false);
    setTutorialThreeWrongTriggered(false);
    setTutorialEngine(createInitialTutorialEngineState());
    setTutorialWelcomeVisible(tutorialMode);
    setGuessStats(createEmptyGuessStats());
    setVeilVisible(true);
  }, [modeConfig, tutorialMode]);

  useEffect(() => {
    if (isSpeedrun && !veilVisible) {
      startTimer();
    }
  }, [isSpeedrun, veilVisible, startTimer]);

  useEffect(() => {
    if (!currentStation && unseenStations.length > 0) {
      getNewStation();
    }
  }, [currentStation, getNewStation, unseenStations.length]);

  useEffect(() => {
    if (clickedStations.length > 0 && unseenStations.length === 0 && !currentStation) {
      stopTimer();
      const delay = setTimeout(() => setModalOpen(true), config.transitions.gameEndModalDelayMs);
      return () => clearTimeout(delay);
    }
  }, [clickedStations.length, currentStation, stopTimer, unseenStations.length]);

  const tutorialCtx = useMemo(() => ({
    tutorialActive: tutorialMode,
    isSpeedrun,
    currentStation,
    wrongCount: TRIES_PER_STATION - tries,
    clickedStationsCount: clickedStations.length,
    totalStations,
    newlyCorrectStation,
    revealedStation: tutorialEngine.revealedStation,
  }), [tutorialMode, isSpeedrun, currentStation, tries, clickedStations.length, totalStations, newlyCorrectStation, tutorialEngine.revealedStation]);

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

  return (
    <>
      <div className={styles.GameContainer}>
        {showGreenFlash && <div className={styles.greenFlash} aria-hidden="true" />}
        {showRedFlash && <div className={styles.redFlash} aria-hidden="true" />}
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
          onTutorialHighlightRect={setTutorialAnchorRect}
          tries={tries}
          onMapReady={() => { if (!tutorialWelcomeVisible) setVeilVisible(false); }}
          blocked={modalOpen || tutorialWelcomeVisible}
        />
        <div
          className={`${styles.seaVeil} ${veilVisible ? "" : styles.seaVeilHidden}`}
          aria-hidden="true"
        />
        {tutorialWelcomeVisible && tutorialMode && (
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
          anchorRect={activeTutorialCard?.target === "clicked-station" ? tutorialAnchorRect : null}
          dimmed={activeTutorialCard?.dimmed !== false}
          showContinue={activeTutorialCard?.continueable !== false}
          onContinue={advanceTutorialQueue}
        />
        <FixedBar
          currentStation={tutorialWelcomeVisible ? "" : currentStation}
          tries={tries}
          getStationsLeft={getStationsLeft}
          setModalOpen={setModalOpen}
          restartGame={resetStandardGame}
          minimal={false}
          highlightStationCard={tutorialEngine.visible && activeTutorialCard?.target === "station-card"}
          highlightLives={tutorialEngine.visible && activeTutorialCard?.target === "lives"}
          highlightScore={tutorialEngine.visible && activeTutorialCard?.target === "score"}
        />
        <GameFinishModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          guessStats={guessStats}
          onPlayAgain={resetStandardGame}
          onExploreMap={onExploreMap}
          finalTimeMs={isSpeedrun ? finalTimeMs : null}
          tutorialMode={tutorialMode}
        />
        <Analytics />
      </div>
      {!isSpeedrun && !modalOpen && !tutorialWelcomeVisible && (
        <HintButton
          currentStation={currentStation}
          triesLeft={tries}
          triesPerStation={TRIES_PER_STATION}
          highlighted={tutorialEngine.visible && activeTutorialCard?.target === "hints"}
        />
      )}
      {isSpeedrun && penaltyLabels.map(({ id, dx }) => (
        <span
          key={id}
          className={styles.penaltyLabelFixed}
          style={{ ["--penalty-dx" as never]: `${dx}px` }}
          aria-hidden="true"
        >+1s</span>
      ))}
    </>
  );
}
