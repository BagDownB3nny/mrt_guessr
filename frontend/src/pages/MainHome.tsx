import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Home.module.css";
import Home from "./Home";
import { Analytics } from "@vercel/analytics/react";

export default function Mainhome() {
  const navigate = useNavigate();
  const [isDeparting, setIsDeparting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleSelectStation = (route?: string) => {
    if (isDeparting || !route) return;
    setIsDeparting(true);
    timerRef.current = window.setTimeout(() => {
      navigate(route);
    }, 700);
  };

  return (
    <div className={styles.scene}>
      <div
        className={`${styles.overlayLayer} ${
          isDeparting ? styles.overlayLifted : ""
        }`}
      >
        <Home onSelectStation={handleSelectStation} />
      </div>
      <Analytics />
    </div>
  );
}
