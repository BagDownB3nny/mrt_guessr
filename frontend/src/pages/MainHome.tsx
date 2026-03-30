import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Home.module.css";
import Home from "./Home";
import { Analytics } from "@vercel/analytics/react";

// Keep this short: once the screen is fully sea-blue, navigate immediately.
const TRAVEL_DURATION = 1000;

export default function Mainhome() {
  const navigate  = useNavigate();
  const [phase, setPhase] = useState<"idle" | "travelling">("idle");

  const handleSelectStation = (route?: string) => {
    if (phase !== "idle" || !route) return;

    setPhase("travelling");
    setTimeout(() => navigate(route), TRAVEL_DURATION);
  };

  return (
    <div className={styles.scene}>
      {/*
        The overlay is never scrolled — it just sits over the game background.
        We use CSS transforms to animate it out.
      */}
      <div className={styles.overlayLayer}>
        {/*
          Inner content wrapper.
          On "travelling": slides up following the red line over 1s.
        */}
        <div className={[
          styles.homeContent,
          phase === "travelling" ? styles.homeContentTravelling : "",
        ].filter(Boolean).join(" ")}>
          <Home onSelectStation={handleSelectStation} />
        </div>

        {/* Sea-colour veil — fades in during travel */}
        <div
          className={[
            styles.seaVeil,
            phase === "travelling" ? styles.seaVeilVisible : "",
          ].filter(Boolean).join(" ")}
          aria-hidden="true"
        />
      </div>
      <Analytics />
    </div>
  );
}
