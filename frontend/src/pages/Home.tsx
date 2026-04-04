import React, { useEffect, useRef, useState } from "react";
import styles from "../css/Home.module.css";
import TrackButtonContainer from "../components/TrackButtonContainer";
import config from "../config/constants.json";


const KOFI_URL = "https://ko-fi.com/ratdownr3my";

type StationConfig = {
  code?: string;
  disabled?: boolean;
  onClick: () => void;
  text: string;
};

type HomeProps = {
  onSelectStation: (route?: string) => void;
};

export default function Home({ onSelectStation }: HomeProps) {
  const homeBackground = (config as any).homeBackground;
  const isMobile = window.innerWidth <= 768;
  const modeConfig = isMobile ? homeBackground.mobile : homeBackground.desktop;
  const speed = modeConfig.backgroundSpeedPxPerFrame;
  const boundaryWidth = modeConfig.boundaryWidthPx;
  const boundaryHeight = modeConfig.boundaryHeightPx;
  const scale = modeConfig.backgroundScale;
  const imageWidth = homeBackground.backgroundImageWidthPx;
  const imageHeight = homeBackground.backgroundImageHeightPx;
  const imageAspectRatio = imageWidth / imageHeight;
  const fittedImageHeight = Math.min(boundaryHeight, boundaryWidth / imageAspectRatio);
  const fittedImageWidth = fittedImageHeight * imageAspectRatio;
  const [bgOffset, setBgOffset] = useState(() => {
    const limitX = Math.max(0, (fittedImageWidth - boundaryWidth) / 2);
    const limitY = Math.max(0, (fittedImageHeight - boundaryHeight) / 2);
    return {
      x: (Math.random() * 2 - 1) * limitX,
      y: (Math.random() * 2 - 1) * limitY,
    };
  });
  const velocityRef = useRef({ x: speed, y: speed });

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      setBgOffset((prev) => {
        const limitX = Math.max(0, (fittedImageWidth - boundaryWidth) / 2);
        const limitY = Math.max(0, (fittedImageHeight - boundaryHeight) / 2);
        let nextX = prev.x + velocityRef.current.x;
        let nextY = prev.y + velocityRef.current.y;

        if (nextX <= -limitX || nextX >= limitX) {
          velocityRef.current.x *= -1;
          nextX = Math.max(-limitX, Math.min(limitX, nextX));
        }
        if (nextY <= -limitY || nextY >= limitY) {
          velocityRef.current.y *= -1;
          nextY = Math.max(-limitY, Math.min(limitY, nextY));
        }

        return { x: nextX, y: nextY };
      });
      rafId = requestAnimationFrame(tick);
    };

    velocityRef.current = { x: speed, y: speed };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isMobile, speed, boundaryWidth, boundaryHeight, fittedImageWidth, fittedImageHeight]);

  const renderBackground = () => (
    <img
      aria-hidden="true"
      src="/home-mrt-map-bg.png"
      alt=""
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        width: fittedImageWidth,
        height: fittedImageHeight,
        zIndex: 0,
        opacity: homeBackground.mapOpacity,
        filter: `grayscale(${homeBackground.mapGrayscale})`,
        pointerEvents: "none",
        objectFit: "contain",
        maxWidth: "none",
        transform: `translate(calc(-50% + ${bgOffset.x}px), calc(-50% + ${bgOffset.y}px)) scale(${scale})`,
        transformOrigin: "center center",
      }}
    />
  );

  const stations: StationConfig[] = [
    { text: "Daily Challenge",    onClick: () => onSelectStation("/daily") },
    { text: "Quickplay",          onClick: () => onSelectStation("/quickgame") },
    { text: "Singapore Tour",     onClick: () => onSelectStation("/singaporetour") },
    { text: "Speedrun",           onClick: () => onSelectStation("/speedrun") },
    { text: "Custom Challenges",  onClick: () => onSelectStation(), disabled: true },
  ];

  return (
    <>
      {renderBackground()}

      {/* ── First viewport: title + buttons ── */}
      <div className={styles.home}>
        <div className={styles.titleContainer}>
          <div
            className={styles.title}
            style={{
              ["--title-underline-offset" as any]: `${homeBackground.titleUnderlineOffsetRem}rem`,
              ["--title-underline-overhang" as any]: `${homeBackground.titleUnderlineOverhangPct}%`,
            }}
          >
            Mrt Guessr
          </div>
        </div>

        {/* Track: line + station buttons.
            The track is inline-flex so it shrink-wraps to button width.
            The line is absolutely positioned inside the track. */}
        <div className={styles.trackContainer}>
          <div className={styles.track} id="stationTrack">
            <div className={styles.trackLine} aria-hidden="true" />
            {stations.map((station) => (
              <TrackButtonContainer
                key={station.code}
                code={station.code}
                disabled={station.disabled}
                onClick={station.onClick}
                text={station.text}
                variant="station"
              />
            ))}
            {/* The tail extends the line 2 more screens below the last button,
                still inside the track so it stays aligned */}
            <div className={styles.lineTail} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* ── Bottom bar: misc links ── */}
      <div className={styles.bottomBar}>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.bottomLink}
        >
          ☕ Buy the devs a coffee
        </a>
      </div>

    </>
  );
}
