import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Home.module.css";
import Home from "./Home";
import { Analytics } from "@vercel/analytics/react";

const SCROLL_DISTANCE = typeof window !== "undefined" ? window.innerHeight * 2 : 1600;
const SCROLL_DURATION = 1500; // scroll takes 1.5s
const LIFT_DELAY      = 80;   // brief pause before lift
const LIFT_DURATION   = 700;  // matches CSS transition

export default function Mainhome() {
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [locked, setLocked]       = useState(true);
  const [lifted, setLifted]       = useState(false);
  const [departing, setDeparting] = useState(false);
  const [veilOpacity, setVeilOpacity] = useState(0);

  // Tie veil opacity to scroll progress (0 → 1 over SCROLL_DISTANCE px)
  const handleScroll = useCallback(() => {
    const el = overlayRef.current;
    if (!el) return;
    const progress = Math.min(el.scrollTop / SCROLL_DISTANCE, 1);
    setVeilOpacity(progress);
  }, []);

  const handleSelectStation = (route?: string) => {
    if (departing || !route) return;
    setDeparting(true);
    setLocked(false);

    overlayRef.current?.scrollTo({ top: SCROLL_DISTANCE, behavior: "smooth" });

    setTimeout(() => setLifted(true), SCROLL_DURATION + LIFT_DELAY);
    setTimeout(() => navigate(route), SCROLL_DURATION + LIFT_DELAY + LIFT_DURATION);
  };

  const cls = [
    styles.overlayLayer,
    locked  ? styles.overlayLocked : "",
    lifted  ? styles.overlayLifted : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={styles.scene}>
      <div className={cls} ref={overlayRef} onScroll={handleScroll}>
        <Home onSelectStation={handleSelectStation} />
        {/* Sea-colour veil: fades in as scroll progresses */}
        <div
          className={styles.seaVeil}
          style={{ opacity: veilOpacity }}
          aria-hidden="true"
        />
      </div>
      <Analytics />
    </div>
  );
}
