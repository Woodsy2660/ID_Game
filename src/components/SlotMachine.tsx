"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

interface SlotMachineProps {
  /** The number to land on (1-10) */
  targetNumber: number;
  /** Called when animation completes */
  onComplete: () => void;
}

/**
 * Slot-machine style number spinner.
 * Numbers scroll vertically like a reel, decelerate, and land with a bounce.
 */
export default function SlotMachine({ targetNumber, onComplete }: SlotMachineProps) {
  const [phase, setPhase] = useState<"spinning" | "landing" | "done">("spinning");
  const controls = useAnimation();
  const numberHeight = 100; // px per number cell
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // Build a long reel: repeat numbers several times then end on target
  const reelNumbers: number[] = [];
  for (let cycle = 0; cycle < 6; cycle++) {
    reelNumbers.push(...numbers);
  }
  // Add numbers up to target at the end for a clean landing
  for (let i = 1; i <= targetNumber; i++) {
    reelNumbers.push(i);
  }

  const finalIndex = reelNumbers.length - 1;
  const finalOffset = -(finalIndex * numberHeight);

  useEffect(() => {
    const animate = async () => {
      // Fast spin phase — go most of the way quickly
      const midOffset = -((reelNumbers.length - 10) * numberHeight);
      await controls.start({
        y: midOffset,
        transition: { duration: 1.8, ease: "linear" },
      });

      // Deceleration + bounce landing
      setPhase("landing");
      await controls.start({
        y: finalOffset,
        transition: {
          duration: 1.2,
          ease: [0.2, 0.8, 0.3, 1],
        },
      });

      // Bounce effect
      await controls.start({
        y: finalOffset - 15,
        transition: { duration: 0.1, ease: "easeOut" },
      });
      await controls.start({
        y: finalOffset,
        transition: { duration: 0.15, type: "spring", stiffness: 500, damping: 15 },
      });

      setPhase("done");
      // Brief pause then callback
      setTimeout(onComplete, 1500);
    };

    animate();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6">
      {/* Title */}
      <motion.h1
        className="text-3xl font-extrabold mb-2 text-center"
        style={{ color: "var(--accent-yellow)" }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Your Question Number...
      </motion.h1>
      <motion.p
        className="text-sm mb-8 opacity-60 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.2 }}
      >
        Watch the reel spin!
      </motion.p>

      {/* Slot reel container */}
      <div className="relative w-[140px] h-[100px] overflow-hidden rounded-2xl"
        style={{
          background: "var(--bg-card)",
          border: phase === "done" ? "3px solid var(--accent-yellow)" : "3px solid rgba(255,255,255,0.15)",
          boxShadow: phase === "done"
            ? "0 0 30px rgba(255,215,0,0.5), inset 0 0 20px rgba(255,215,0,0.1)"
            : "0 0 20px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)",
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}
      >
        {/* Gradient overlays for depth */}
        <div className="absolute inset-x-0 top-0 h-6 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, var(--bg-card), transparent)" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-6 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to top, var(--bg-card), transparent)" }}
        />

        {/* Scrolling number reel */}
        <motion.div animate={controls} style={{ y: 0 }}>
          {reelNumbers.map((num, i) => (
            <div
              key={i}
              className="flex items-center justify-center font-black"
              style={{
                height: `${numberHeight}px`,
                fontSize: "3.5rem",
                color: i === finalIndex && phase === "done" ? "var(--accent-yellow)" : "var(--text-primary)",
                textShadow: i === finalIndex && phase === "done" ? "0 0 20px rgba(255,215,0,0.8)" : "none",
              }}
            >
              {num}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Landing indicator */}
      {phase === "done" && (
        <motion.div
          className="mt-6 text-lg font-bold"
          style={{ color: "var(--accent-yellow)" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          ⭐ Question {targetNumber} ⭐
        </motion.div>
      )}
    </div>
  );
}
