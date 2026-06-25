"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const COLOR_CYCLE = [
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#0f52ba",
  "#d4af37",
  "#6d28d9",
  "#059669",
  "#0891b2",
  "#7c3aed",
  "#db2777",
  "#2563eb",
  "#ea580c",
];

interface BlobConfig {
  size: number;
  initialX: string;
  initialY: string;
  moveDuration: number;
  pathIndex: number;
  colorOffset: number;
  colorDuration: number;
}

const BLOBS: BlobConfig[] = [
  { size: 600, initialX: "-10%", initialY: "-10%", moveDuration: 25, pathIndex: 0, colorOffset: 0, colorDuration: 8000 },
  { size: 800, initialX: "60%", initialY: "40%", moveDuration: 30, pathIndex: 1, colorOffset: 4, colorDuration: 10000 },
  { size: 500, initialX: "25%", initialY: "15%", moveDuration: 22, pathIndex: 2, colorOffset: 8, colorDuration: 7000 },
  { size: 350, initialX: "0%", initialY: "60%", moveDuration: 28, pathIndex: 0, colorOffset: 2, colorDuration: 9000 },
];

const PATHS = [
  { x: [0, 120, -80, 60, 0], y: [0, 60, 140, -30, 0] },
  { x: [0, -100, 100, -60, 0], y: [0, 100, -60, 80, 0] },
  { x: [0, 80, -140, 40, 0], y: [0, -90, 80, 120, 0] },
];

function Blob({ config }: { config: BlobConfig }) {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setColorIndex((i) => (i + 1) % COLOR_CYCLE.length);
    }, config.colorDuration);
    return () => clearInterval(timer);
  }, [config.colorDuration]);

  const path = PATHS[config.pathIndex];
  const currentColor = COLOR_CYCLE[(colorIndex + config.colorOffset) % COLOR_CYCLE.length];

  return (
    <motion.div
      className="absolute rounded-full mix-blend-screen opacity-35 pointer-events-none"
      style={{
        width: config.size,
        height: config.size,
        left: config.initialX,
        top: config.initialY,
        filter: "url(#goo)",
      }}
      animate={{
        x: path.x,
        y: path.y,
        scale: [1, 1.15, 0.9, 1.05, 1],
        backgroundColor: currentColor,
      }}
      transition={{
        x: { duration: config.moveDuration, repeat: Infinity, ease: "easeInOut" },
        y: { duration: config.moveDuration, repeat: Infinity, ease: "easeInOut" },
        scale: { duration: config.moveDuration * 0.7, repeat: Infinity, ease: "easeInOut" },
        backgroundColor: { duration: 3, ease: "easeInOut" },
      }}
    />
  );
}

export const LavaLamp = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {BLOBS.map((config, i) => (
          <Blob key={i} config={config} />
        ))}
      </div>

      <svg className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12"
              result="goo"
            />
          </filter>
        </defs>
      </svg>
    </>
  );
};
