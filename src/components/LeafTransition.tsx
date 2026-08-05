import { motion, useReducedMotion } from "motion/react";

import { PixelLeaf } from "./pixel/PixelIcons";

/** Leaves fly across the screen as a section scrolls into view. */
export function LeafTransition({ from = "left" }: { from?: "left" | "right" }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className="h-6" />;

  const leaves = [
    { top: 10, size: 22, delay: 0, dur: 2.2 },
    { top: 34, size: 30, delay: 0.25, dur: 2.6 },
    { top: 62, size: 18, delay: 0.45, dur: 2.0 },
    { top: 80, size: 26, delay: 0.15, dur: 2.9 },
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none relative h-16 w-full overflow-hidden">
      {leaves.map((l, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: `${l.top}%`, width: l.size, height: l.size }}
          initial={{ x: from === "left" ? "-10vw" : "110vw", rotate: 0, opacity: 0 }}
          whileInView={{
            x: from === "left" ? "110vw" : "-10vw",
            rotate: from === "left" ? 420 : -420,
            opacity: [0, 0.85, 0.85, 0],
          }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: l.dur, delay: l.delay, ease: "easeInOut" }}
        >
          <PixelLeaf className="h-full w-full" />
        </motion.div>
      ))}
    </div>
  );
}