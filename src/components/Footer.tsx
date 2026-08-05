import { motion, useReducedMotion } from "motion/react";

import { PixelButterfly, PixelCaterpillar, PixelCocoon } from "./pixel/PixelIcons";

function Grass() {
  const blades = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-between px-1">
      {blades.map((i) => (
        <motion.div
          key={i}
          className="origin-bottom rounded-t-sm"
          style={{
            width: 5,
            height: 22 + ((i * 7) % 26),
            background: i % 3 === 0 ? "var(--moss)" : i % 3 === 1 ? "var(--leaf)" : "var(--olive)",
            opacity: 0.75,
          }}
          animate={{ skewX: [-5, 5, -5] }}
          transition={{ duration: 3 + (i % 5) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

export function Footer() {
  const reduce = useReducedMotion();

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border/60">
      <div className="mx-auto max-w-6xl px-5 pb-28 pt-12 sm:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <PixelCocoon className="h-9 w-9" />
          <p className="pixel text-[11px] text-foreground">Silk Cocoon AI</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Grown in a quiet mulberry grove. Frontend demo with placeholder data — no models were harmed.
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Silk Cocoon AI. All rights reserved.</p>
        </div>
      </div>

      {!reduce && (
        <>
          <motion.div
            aria-hidden="true"
            className="absolute bottom-12 h-7 w-7"
            animate={{ x: ["2vw", "88vw"], y: [0, -6, 0] }}
            transition={{ duration: 34, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          >
            <motion.div animate={{ scaleX: [1, 0.85, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
              <PixelCaterpillar className="h-full w-full" />
            </motion.div>
          </motion.div>

          {[
            { left: "18%", bottom: "42%", dur: 13 },
            { left: "72%", bottom: "55%", dur: 17 },
          ].map((b, i) => (
            <motion.div
              key={i}
              aria-hidden="true"
              className="absolute h-6 w-6"
              style={{ left: b.left, bottom: b.bottom }}
              animate={{ x: [0, 70, -50, 0], y: [0, -40, 25, 0] }}
              transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <PixelButterfly className="h-full w-full" />
              </motion.div>
            </motion.div>
          ))}
        </>
      )}

      <Grass />
    </footer>
  );
}