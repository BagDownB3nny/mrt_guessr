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


const getStationName = (id: String) => {
  return id.substring(0, id.length - 7).replace(/_/g, " ");
};

const MrtMapController = (props: any) => {
  let {
    onCorrectClick,
    onWrongClick,
    currentStation,
    newlyCorrectStation,
    tries,
  } = props;

  const currentStationRef = useRef(currentStation);
  const currentTries = useRef(tries);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  // Track pan/pinch at the container level so station elements stay touch-listener-free
  const touchMovedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // At the container level: block browser pinch + track whether a touch moved.
  // Keeping ALL touch listeners OFF station elements so iOS Safari doesn't route
  // the first touch's ownership to a deep SVG child (which breaks pinch detection).
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      touchMovedRef.current = false;
      const api = transformRef.current;
      if (e.touches.length >= 2) {
        // Non-passive preventDefault blocks iOS from intercepting as a page pinch
        e.preventDefault();
        // Work around a react-zoom-pan-pinch 3.6.1 bug:
        // The library's onTouchStart checks if the PREVIOUS touchstart was within
        // 200ms and treats it as a "double tap", skipping the entire handler.
        // For a fast pinch, finger2 always arrives within 200ms of finger1, so
        // the 2nd touchstart (with touches.length===2) never triggers pinch setup.
        // Fix: clear lastTouch so the 2nd touchstart passes the double-tap guard.
        // We use capture:true so our listener fires BEFORE the library's listener.
        if (api && api.instance) {
          (api.instance as any).lastTouch = null;
        }
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      touchMovedRef.current = true;
    };

    // capture:true ensures we run BEFORE the library's bubble-phase touchstart
    container.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      container.removeEventListener("touchstart", onTouchStart, { capture: true });
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);

  useEffect(() => {
    currentTries.current = tries;
  }, [tries]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateIsMobile = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    updateIsMobile(mediaQuery);

    const handleChange = (event: MediaQueryListEvent) => updateIsMobile(event);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const handleClick = (e: any) => {
    const station = getStationName(e);
    if (station === currentStationRef.current) {
      onCorrectClick(station, currentTries.current);
    } else {
      onWrongClick();
    }
  };

  useEffect(() => {
    if (tries <= 0) {
      const correctStationButtonId = `${currentStation.replaceAll(
        " ",
        "_"
      )}_Button`;
      const correctButtonElement = document.getElementById(
        correctStationButtonId
      );
      if (correctButtonElement) {
        if (document.getElementById("showButtonCircle")) {
          return;
        }

        // Pan the map to center the correct station, keeping current zoom level
        try {
          const api = transformRef.current;
          if (api) {
            const currentScale = api.instance.transformState.scale;
            api.zoomToElement(correctButtonElement, currentScale, 500, "easeOut");
          }
        } catch (_) {
          // If pan fails for any reason, just skip it — the circle will still show
        }

        // Show the highlight circle after a short delay so the pan finishes first
        setTimeout(() => {
          const el = document.getElementById(correctStationButtonId);
          if (!el || document.getElementById("showButtonCircle")) return;

          const rect = el.getBoundingClientRect();
          const circleElement = document.createElement("div");
          circleElement.id = "showButtonCircle";
          circleElement.className = styles.circle;
          const circleSize = isMobile ? 96 : 160;

          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          circleElement.style.width = `${circleSize}px`;
          circleElement.style.height = `${circleSize}px`;
          circleElement.style.left = `${centerX - circleSize / 2}px`;
          circleElement.style.top = `${centerY - circleSize / 2}px`;

          circleElement.addEventListener("animationend", () => {
            circleElement.remove();
          });
          document.body.appendChild(circleElement);
        }, 550);
      }
    }
  }, [currentStation, isMobile, tries]);

  useEffect(() => {
    const id = `${newlyCorrectStation.replaceAll(" ", "_")}`;
    const correctTextElement = document.getElementById(`${id}_Text`);
    if (correctTextElement) {
      correctTextElement.style.display = "block";
    }
  }, [newlyCorrectStation]);

  const addStyleToStationsAndText = () => {
    // Set touch-action: none on the SVG and all its descendants.
    // touch-action doesn't cascade through SVG elements, so we must set it
    // explicitly on each node that sits between the wrapper and the stations.
    const svgEl = document.querySelector('svg#New_Map') as SVGElement | null;
    if (svgEl) {
      (svgEl as any).style.touchAction = "none";
      svgEl.querySelectorAll('*').forEach((el) => {
        (el as HTMLElement).style.touchAction = "none";
      });
    }

    const buttonElements = document.querySelectorAll('[id$="_Button"]');
    buttonElements.forEach((el) => {
      el.classList.add(styles.station);
      if (el.getAttribute("data-bound-click") === "true") {
        return;
      }

      el.setAttribute("data-bound-click", "true");
      // NO touch listeners on station elements — all touch tracking happens at
      // the container level so iOS Safari never routes a touch's ownership here.
      el.addEventListener("click", () => {
        // If a touch moved before this click, it was a pan — skip
        if (touchMovedRef.current) return;
        // Pop feedback animation — double rAF reliably restarts on SVG elements
        el.classList.remove(styles.stationPop);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.classList.add(styles.stationPop);
            el.addEventListener("animationend", () => {
              el.classList.remove(styles.stationPop);
            }, { once: true });
          });
        });
        handleClick(el.id);
      });
    });

    const textElements = document.querySelectorAll('[id$="_Text"]');
    textElements.forEach((el) => {
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
            title="React"
            onLoad={addStyleToStationsAndText}
          />
        </TransformComponent>
        <div className={styles.mapTools}>
          <Controls />
          <MiniMap
            width={isMobile ? 124 : 220}
            height={isMobile ? 88 : 156}
            borderColor="#262627"
          >
            <SVG
              src="/full-mrt-map.svg"
              width="100%"
              height="100%"
              title="React"
            />
          </MiniMap>
        </div>
      </TransformWrapper>
    </div>
  );
};

export default MrtMapController;
