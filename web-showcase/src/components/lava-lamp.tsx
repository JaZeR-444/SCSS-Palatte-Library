"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface BlobProps {
  color: string;
  size: number;
  initialX: string;
  initialY: string;
  duration: number;
}

const Blob = ({ color, size, initialX, initialY, duration }: BlobProps) => {
  return (
    <motion.div
      className="absolute rounded-full blur-[20px] mix-blend-screen opacity-50 pointer-events-none"
      style={{
        width: size,
        height: size,
        left: initialX,
        top: initialY,
        backgroundColor: color,
        filter: "url(#goo)",
      }}
      animate={{
        x: [0, 100, -50, 0],
        y: [0, 50, 120, 0],
        scale: [1, 1.1, 0.9, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

export const LavaLamp = ({ colors = ["#6366f1", "#a855f7", "#ec4899"] }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Blob color={colors[0]} size={600} initialX="-10%" initialY="-10%" duration={25} />
        <Blob color={colors[1] || colors[0]} size={800} initialX="60%" initialY="40%" duration={30} />
        <Blob color={colors[2] || colors[0]} size={500} initialX="30%" initialY="20%" duration={22} />
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
