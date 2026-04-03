import { useEffect, useRef, useState } from "react";
import config from "../config/constants.json";
import { getAllStations } from "../data/stations";
import { getLinesForStation } from "../data/stationLines";
import styles from "../css/HomeFallingCapsules.module.css";

type Capsule = {
  id: number;
  station: string;
  colorVar: string;
  x: number;
  y: number;
  rotation: number;
  spinDir: 1 | -1;
};

const BG = (config as any).homeBackground;
const SPAWN_RATE_MS = BG.capsuleSpawnRateMs as number;
const FALL_SPEED = BG.capsuleFallSpeedPxPerFrame as number;
const SPIN_SPEED = BG.capsuleSpinSpeedDegPerFrame as number;
const MAX_CAPSULES = BG.capsuleMaxCount as number;
const CAPSULE_WIDTH = 230;
const CAPSULE_HEIGHT = 56;
const STATIONS = getAllStations();

function makeCapsule(id: number): Capsule {
  const station = STATIONS[Math.floor(Math.random() * STATIONS.length)];
  const lines = getLinesForStation(station);
  const colorVar = lines[0]?.cssVar ?? "--color-nsrl";
  const maxX = Math.max(0, window.innerWidth - CAPSULE_WIDTH);
  return {
    id,
    station,
    colorVar,
    x: Math.random() * maxX,
    y: -CAPSULE_HEIGHT - Math.random() * 120,
    rotation: Math.random() * 360,
    spinDir: Math.random() > 0.5 ? 1 : -1,
  };
}

export default function HomeFallingCapsules() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const rafRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const spawn = () => {
      setCapsules((prev) => {
        if (prev.length >= MAX_CAPSULES) return prev;
        idRef.current += 1;
        return [...prev, makeCapsule(idRef.current)];
      });
    };

    spawn();
    spawnTimerRef.current = window.setInterval(spawn, SPAWN_RATE_MS);

    const tick = () => {
      setCapsules((prev) => prev
        .map((capsule) => ({
          ...capsule,
          y: capsule.y + FALL_SPEED,
          rotation: capsule.rotation + SPIN_SPEED * capsule.spinDir,
        }))
        .filter((capsule) => capsule.y < window.innerHeight + CAPSULE_HEIGHT)
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (spawnTimerRef.current !== null) window.clearInterval(spawnTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={styles.layer} aria-hidden="true">
      {capsules.map((capsule) => (
        <div
          key={capsule.id}
          className={styles.capsule}
          style={{
            transform: `translate(${capsule.x}px, ${capsule.y}px) rotate(${capsule.rotation}deg)`,
            backgroundColor: `var(${capsule.colorVar})`,
          }}
        >
          <span className={styles.stationText}>{capsule.station}</span>
        </div>
      ))}
    </div>
  );
}
