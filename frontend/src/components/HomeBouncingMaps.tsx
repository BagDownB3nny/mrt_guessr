import { useEffect, useMemo, useRef, useState } from "react";
import config from "../config/constants.json";
import styles from "../css/HomeBouncingMaps.module.css";

type Tile = { id: number; x: number; y: number; vx: number; vy: number };

const BG = (config as any).homeBackground;
const TILE_COUNT = BG.tileCount as number;
const TILE_WIDTH = BG.tileWidthPx as number;
const TILE_HEIGHT = BG.tileHeightPx as number;
const SPEED = BG.speedPxPerFrame as number;

export default function HomeBouncingMaps() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const rafRef = useRef<number | null>(null);

  const initialTiles = useMemo(
    () => Array.from({ length: TILE_COUNT }, (_, i) => ({
      id: i,
      x: 48 + i * 36,
      y: 72 + i * 28,
      vx: SPEED,
      vy: SPEED,
    })),
    []
  );

  useEffect(() => {
    setTiles(initialTiles);
  }, [initialTiles]);

  useEffect(() => {
    const tick = () => {
      setTiles((prev) => prev.map((tile) => {
        const maxX = Math.max(0, window.innerWidth - TILE_WIDTH);
        const maxY = Math.max(0, window.innerHeight - TILE_HEIGHT);
        let nextX = tile.x + tile.vx;
        let nextY = tile.y + tile.vy;
        let nextVx = tile.vx;
        let nextVy = tile.vy;

        if (nextX <= 0 || nextX >= maxX) {
          nextVx = -nextVx;
          nextX = Math.min(Math.max(nextX, 0), maxX);
        }
        if (nextY <= 0 || nextY >= maxY) {
          nextVy = -nextVy;
          nextY = Math.min(Math.max(nextY, 0), maxY);
        }

        return { ...tile, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
      }));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (TILE_COUNT <= 0) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className={styles.tile}
          style={{ width: TILE_WIDTH, height: TILE_HEIGHT, transform: `translate(${tile.x}px, ${tile.y}px)` }}
        >
          <img src="/mrt.png" alt="" className={styles.image} draggable={false} />
        </div>
      ))}
    </div>
  );
}
