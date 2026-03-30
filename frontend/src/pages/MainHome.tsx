import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Home.module.css";
import Home from "./Home";
import { Analytics } from "@vercel/analytics/react";

const SCROLL_DISTANCE = typeof window !== "undefined" ? window.innerHeight * 2 : 1600;
const SCROLL_DURATION = 900;  // must be long enough for smooth scroll to finish
const LIFT_DELAY     = 100;   // brief pause between scroll stop and lift
const LIFT_DURATION  = 700;   // matches CSS transition duration

export default function Mainhome() {
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [locked, setLocked]   = useState(true);   // prevent user scrolling before tap
  const [lifted, setLifted]   = useState(false);  // triggers translateY(-100%)
  const [departing, setDeparting] = useState(false);

  const handleSelectStation = (route?: string) => {
    if (departing || !route) return;
    setDeparting(true);
    setLocked(false);

    // Scroll the overlay down 2 screen-heights (following the red line)
    overlayRef.current?.scrollTo({ top: SCROLL_DISTANCE, behavior: "smooth" });

    // Lift the overlay after scroll finishes
    setTimeout(() => setLifted(true), SCROLL_DURATION + LIFT_DELAY);

    // Navigate after lift completes
    setTimeout(() => navigate(route), SCROLL_DURATION + LIFT_DELAY + LIFT_DURATION);
  };

  const cls = [
    styles.overlayLayer,
    locked   ? styles.overlayLocked : "",
    lifted   ? styles.overlayLifted : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={styles.scene}>
      <div className={cls} ref={overlayRef}>
        <Home onSelectStation={handleSelectStation} />
      </div>
      <Analytics />
    </div>
  );
}
