import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Home.module.css";
import Home from "./Home";
import { Analytics } from "@vercel/analytics/react";

// All durations in ms — CSS transitions must match these exactly
const TRAVEL_DURATION = 1000; // content slides up (simulates scrolling down the line)
const LIFT_DELAY      = 80;   // brief pause before the overlay lifts
const LIFT_DURATION   = 700;  // overlay translateY(-100%) — matches CSS transition

export default function Mainhome() {
  const navigate  = useNavigate();
  const [phase, setPhase] = useState<"idle" | "travelling" | "lifting">("idle");
  const routeRef  = useRef<string>("");

  const handleSelectStation = (route?: string) => {
    if (phase !== "idle" || !route) return;
    routeRef.current = route;

    // Phase 1: slide content up + fade veil in (CSS animation, 1.5s)
    setPhase("travelling");

    // Phase 2: lift the whole overlay after travel finishes
    setTimeout(() => setPhase("lifting"), TRAVEL_DURATION + LIFT_DELAY);

    // Navigate once lifting is done
    setTimeout(() => navigate(route), TRAVEL_DURATION + LIFT_DELAY + LIFT_DURATION);
  };

  return (
    <div className={styles.scene}>
      {/*
        The overlay is never scrolled — it just sits over the game background.
        We use CSS transforms to animate it out.
      */}
      <div
        className={[
          styles.overlayLayer,
          phase === "lifting" ? styles.overlayLifted : "",
        ].filter(Boolean).join(" ")}
      >
        {/*
          Inner content wrapper.
          On "travelling": slides up by 200dvh (following the red line) over 1.5s.
          This simulates the user scrolling down the line.
        */}
        <div className={[
          styles.homeContent,
          phase === "travelling" || phase === "lifting" ? styles.homeContentTravelling : "",
        ].filter(Boolean).join(" ")}>
          <Home onSelectStation={handleSelectStation} />
        </div>

        {/* Sea-colour veil — fades in during travel */}
        <div
          className={[
            styles.seaVeil,
            phase === "travelling" || phase === "lifting" ? styles.seaVeilVisible : "",
          ].filter(Boolean).join(" ")}
          aria-hidden="true"
        />
      </div>
      <Analytics />
    </div>
  );
}
