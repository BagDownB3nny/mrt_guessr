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

// SVG station element IDs follow the pattern "Station_Name_Button".
// This strips the trailing "_Button" suffix and restores spaces.
const getStationName = (id: string): string =>
  id.slice(0, -7).replace(/_/g, " ");

interface Props {
  onCorrectClick: (station: string, tries: number) => void;
  onWrongClick: (stationName: string, x: number, y: number) => void;
  currentStation: string;
  newlyCorrectStation: string;
  tries: number;
  onMapReady?: () => void;
}

export default function MrtMapController({
  onCorrectClick,
  onWrongClick,
  currentStation,
  newlyCorrectStation,
  tries,
  onMapReady,
}: Props) {
  const currentStationRef = useRef(currentStation);
  const currentTriesRef = useRef(tries);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
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

    // Pan to the station (keep current scale, no zoom change)
    try {
      const api = transformRef.current;
      if (api) {
        const scale = api.instance.transformState.scale;
        api.zoomToElement(buttonEl, scale, 500, "easeOut");
      }
    } catch {
      // Pan is best-effort — circle will still appear even if it fails
    }

    // Show the highlight circle after the pan animation completes
    setTimeout(() => {
      const el = document.getElementById(buttonId);
      if (!el || document.getElementById("showButtonCircle")) return;

      const rect = el.getBoundingClientRect();
      const size = isMobile ? 96 : 160;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const circle = document.createElement("div");
      circle.id = "showButtonCircle";
      circle.className = styles.circle;
      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      circle.style.left = `${cx - size / 2}px`;
      circle.style.top = `${cy - size / 2}px`;
      circle.addEventListener("animationend", () => circle.remove());
      document.body.appendChild(circle);
    }, 550);
  }, [currentStation, isMobile, tries]);

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
          // Use the centre of the clicked element for the floating label position
          const rect = (el as Element).getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top;
          onWrongClick(station, cx, cy);
        }
      });
    });

    document.querySelectorAll<Element>('[id$="_Text"]').forEach((el) => {
      el.classList.add(styles.stationText);
    });
  };

  return (
    <div className={styles.mapContainer} ref={mapContainerRef}>
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
          contentStyle={{ width: "100%", height: "100%", touchAction: "none" }}
        >
          <SVG
            src="/full-mrt-map.svg"
            width="100%"
            height="100%"
            title="MRT map"
            onLoad={setupSvg}
          />
        </TransformComponent>
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
