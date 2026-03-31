import { useEffect, useRef, useState } from "react";
import {
  TransformWrapper,
  TransformComponent,
  MiniMap,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import SVG from "react-inlinesvg";
import styles from "../css/MrtMap.module.css";
import Controls from "./Controls";
import config from "../config/constants.json";

// SVG station element IDs follow the pattern "Station_Name_Button".
// This strips the trailing "_Button" suffix and restores spaces.
const getStationName = (id: string): string =>
  id.slice(0, -7).replace(/_/g, " ");

interface WrongLabel {
  id: number;
  label: string;
  screenX: number;  // viewport px — label is rendered in a fixed overlay
  screenY: number;
}

interface Props {
  onCorrectClick: (station: string, tries: number) => void;
  onWrongClick: (stationName: string) => void;
  currentStation: string;
  newlyCorrectStation: string;
  tries: number;
  onMapReady?: () => void;
  blocked?: boolean;  // when true, map is non-interactive (e.g. modal open)
}

export default function MrtMapController({
  onCorrectClick,
  onWrongClick,
  currentStation,
  newlyCorrectStation,
  tries,
  onMapReady,
  blocked = false,
}: Props) {
  const currentStationRef = useRef(currentStation);
  const currentTriesRef = useRef(tries);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const wrongLabelCounter = useRef(0);
  const [wrongLabels, setWrongLabels] = useState<WrongLabel[]>([]);
  const lastClickTimeRef = useRef(0);
  // Reveal circle rendered in a fixed portal (tracks button position live)
  const [revealCircle, setRevealCircle] = useState<{ key: number; buttonId: string; size: number } | null>(null);
  const revealCircleKey = useRef(0);
  const revealCircleDivRef = useRef<HTMLDivElement | null>(null);
  // Tracks whether a touch moved before a click fires, so panning doesn't
  // accidentally trigger station selection.
  const touchMovedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => { currentStationRef.current = currentStation; }, [currentStation]);
  useEffect(() => { currentTriesRef.current = tries; }, [tries]);

  // Keep isMobile in sync with the viewport
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = (e: MediaQueryList | MediaQueryListEvent) => setIsMobile(e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ── Touch handling at the container level ─────────────────────────────────
  //
  // We deliberately keep ALL touch listeners OFF station SVG elements.
  // iOS Safari assigns "finger ownership" to the deepest element that has a
  // touch listener. Once a finger is owned by a deep SVG child, the browser
  // won't merge it with a second finger into a pinch for the TransformWrapper.
  //
  // We also work around a react-zoom-pan-pinch 3.6.1 bug: its onTouchStart
  // handler skips the entire event when the previous touchstart was < 200ms ago
  // (treating it as a double-tap). For a fast pinch, finger 2 always arrives
  // within 200ms, so pinch setup is silently dropped. We clear `lastTouch` in
  // the capture phase (before the library's bubble-phase handler) to bypass it.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      touchMovedRef.current = false;
      if (e.touches.length >= 2) {
        e.preventDefault(); // stop iOS page-level pinch interception
        const api = transformRef.current;
        if (api?.instance) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (api.instance as any).lastTouch = null;
        }
      }
    };
    const onTouchMove = () => { touchMovedRef.current = true; };

    container.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });

    // Expose rzpp instance for automated interaction tests (stripped in production build)
    if (process.env.NODE_ENV !== "production") {
      const api = transformRef.current;
      if (api?.instance) (window as any).__rzpp_test = api.instance; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    return () => {
      container.removeEventListener("touchstart", onTouchStart, { capture: true });
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // ── Reveal correct station after all tries are exhausted ──────────────────
  useEffect(() => {
    if (tries > 0) return;

    const buttonId = `${currentStation.replaceAll(" ", "_")}_Button`;
    const buttonEl = document.getElementById(buttonId);
    if (!buttonEl || document.getElementById("showButtonCircle")) return;

    const spawnCircle = () => {
      const el = document.getElementById(buttonId);
      if (!el) return;

      const size = isMobile ? 96 : 160;

      const key = ++revealCircleKey.current;
      setRevealCircle({ key, buttonId, size });
      setTimeout(() => setRevealCircle((prev) => (prev?.key === key ? null : prev)), 1100);
    };

    // Only skip the pan if the station is near the viewport centre.
    // "Near centre" = within the inner 40% of each dimension.
    // Stations on the edge still get panned to so they're easier to tap.
    const container = mapContainerRef.current;
    const isAlreadyVisible = (() => {
      if (!container) return false;
      const cr = container.getBoundingClientRect();
      const br = buttonEl.getBoundingClientRect();
      const cx = (br.left + br.right) / 2;
      const cy = (br.top + br.bottom) / 2;
      const insetX = cr.width  * 0.30;   // 30% inset = station must be in centre 40%
      const insetY = cr.height * 0.30;
      return (
        cx >= cr.left   + insetX &&
        cx <= cr.right  - insetX &&
        cy >= cr.top    + insetY &&
        cy <= cr.bottom - insetY
      );
    })();

    if (isAlreadyVisible) {
      // Station is on screen — show circle immediately, no pan needed
      spawnCircle();
    } else {
      // Pan to the station first, then show the circle
      try {
        const api = transformRef.current;
        if (api) {
          const scale = api.instance.transformState.scale;
          api.zoomToElement(buttonEl, scale, config.transitions.stationPanDurationMs, "easeOut");
        }
      } catch {
        // Pan is best-effort
      }
      setTimeout(spawnCircle, config.transitions.revealCircleDelayMs);
    }
  }, [currentStation, isMobile, tries]);

  // ── Reveal circle: track button position live so it follows panning ─────
  useEffect(() => {
    if (!revealCircle) return;
    let rafId: number;
    const track = () => {
      const el = document.getElementById(revealCircle.buttonId);
      const div = revealCircleDivRef.current;
      if (el && div) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        div.style.left = `${cx - revealCircle.size / 2}px`;
        div.style.top  = `${cy - revealCircle.size / 2}px`;
      }
      rafId = requestAnimationFrame(track);
    };
    rafId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafId);
  }, [revealCircle]);

  // ── Reveal station name text when correctly guessed ───────────────────────
  useEffect(() => {
    if (!newlyCorrectStation) return;
    const id = newlyCorrectStation.replaceAll(" ", "_");
    const textEl = document.getElementById(`${id}_Text`);
    if (textEl) textEl.style.display = "block";
  }, [newlyCorrectStation]);

  // ── SVG setup: touch-action + click binding ───────────────────────────────
  //
  // touch-action does NOT cascade through SVG elements — must be set inline on
  // every node. We do this once after the SVG loads.
  const setupSvg = () => {
    onMapReady?.();
    const svg = document.querySelector("svg#New_Map");
    if (svg) {
      (svg as HTMLElement).style.touchAction = "none";
      svg.querySelectorAll<HTMLElement>("*").forEach((el) => {
        el.style.touchAction = "none";
      });
    }

    document.querySelectorAll<Element>('[id$="_Button"]').forEach((el) => {
      el.classList.add(styles.station);
      if (el.getAttribute("data-bound-click") === "true") return;
      el.setAttribute("data-bound-click", "true");

      el.addEventListener("click", () => {
        if (touchMovedRef.current) return; // pan gesture, not a tap

        // Debounce: ignore clicks within 200ms of the previous one
        const now = Date.now();
        if (now - lastClickTimeRef.current < 200) return;
        lastClickTimeRef.current = now;

        // Pop animation — double rAF reliably restarts CSS animations on SVG
        el.classList.remove(styles.stationPop);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.classList.add(styles.stationPop);
            el.addEventListener("animationend", () => el.classList.remove(styles.stationPop), { once: true });
          });
        });

        const station = getStationName(el.id);
        if (station === currentStationRef.current) {
          onCorrectClick(station, currentTriesRef.current);
        } else {
          onWrongClick(station);
          // Label lives in a fixed overlay — use raw screen coords directly
          const rect = (el as Element).getBoundingClientRect();
          const screenCx = rect.left + rect.width / 2;
          const screenCy = rect.top;
          const id = ++wrongLabelCounter.current;
          // Replace all previous labels — only show the latest wrong click
          setWrongLabels([{ id, label: station, screenX: screenCx, screenY: screenCy }]);
          setTimeout(() => setWrongLabels((prev) => prev.filter((l) => l.id !== id)), config.transitions.wrongLabelDurationMs);
        }
      });
    });

    document.querySelectorAll<Element>('[id$="_Text"]').forEach((el) => {
      el.classList.add(styles.stationText);
    });
  };

  return (
    <div
      className={styles.mapContainer}
      ref={mapContainerRef}
      style={blocked ? { pointerEvents: "none", touchAction: "none" } : undefined}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        initialPositionX={0}
        initialPositionY={100}
        doubleClick={{ disabled: true }}
        minScale={0.7}
        maxScale={8}
        pinch={{ step: 5 }}
        panning={{ velocityDisabled: true }}
        centerOnInit
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%", touchAction: "none" }}
          contentStyle={{ width: "100%", height: "100%", touchAction: "none", position: "relative" }}
        >
          <SVG
            src="/full-mrt-map.svg"
            width="100%"
            height="100%"
            title="MRT map"
            onLoad={setupSvg}
          />
        </TransformComponent>
        {/* Reveal circle — fixed portal, tracks button live via rAF */}
        {revealCircle && (
          <div
            key={revealCircle.key}
            ref={revealCircleDivRef}
            className={styles.circle}
            style={{
              position: "fixed",
              width: revealCircle.size,
              height: revealCircle.size,
              left: 0,
              top: 0,
            }}
          />
        )}
        {/* Wrong-guess labels — fixed overlay, isolated from TransformComponent to avoid iOS blur */}
        {wrongLabels.map(({ id, label, screenX, screenY }) => (
          <div
            key={id}
            className={styles.wrongLabel}
            style={{ left: screenX, top: screenY }}
            aria-hidden="true"
          >
            {label}
          </div>
        ))}
        <div className={styles.mapTools}>
          <Controls />
          <MiniMap
            width={isMobile ? 124 : 220}
            height={isMobile ? 88 : 156}
            borderColor="#262627"
          >
            <SVG src="/full-mrt-map.svg" width="100%" height="100%" title="MRT map minimap" />
          </MiniMap>
        </div>
      </TransformWrapper>
    </div>
  );
}
