import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Home.module.css";
import Home from "./Home";
import { Analytics } from "@vercel/analytics/react";
import config from "../config/constants.json";

const VEIL_IN_DURATION = config.transitions.landingVeilInMs;

export default function Mainhome() {
  const navigate  = useNavigate();
  const [phase, setPhase] = useState<"idle" | "travelling">("idle");

  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const handleSelectStation = (route?: string) => {
    if (phase !== "idle" || !route) return;

    setPhase("travelling");
    // Switch routes as soon as the veil is fully opaque.
    setTimeout(() => navigate(route), VEIL_IN_DURATION);
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
          style={{ transitionDuration: `${VEIL_IN_DURATION}ms` }}
          aria-hidden="true"
        />
      </div>
      <Analytics />
    </div>
  );
}
