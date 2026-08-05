import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { PixelButterfly, PixelCaterpillar, PixelLeaf } from "./pixel/PixelIcons";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function TreeLine({ fill, height, count, seed }: { fill: string; height: number; count: number; seed: number }) {
  const trees = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const x = (i / count) * 100 + ((seed * (i + 3)) % 7) - 3;
        const h = height * (0.7 + (((seed + i * 13) % 10) / 10) * 0.6);
        return { x, h, w: 4 + ((seed + i * 7) % 4) };
      }),
    [count, height, seed],
  );

  return (
    <div className="absolute inset-x-0 bottom-0" style={{ height: `${height}vh` }}>
      {trees.map((t, i) => (
        <div key={i} className="absolute bottom-0" style={{ left: `${t.x}%` }}>
          {/* pixel canopy: stacked blocks */}
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              style={{
                width: `${t.w * (row + 1) * 0.6}vh`,
                height: `${t.h * 0.16}vh`,
                background: fill,
                marginLeft: `-${t.w * (row + 1) * 0.3}vh`,
              }}
            />
          ))}
          <div
            style={{
              width: `${t.w * 0.35}vh`,
              height: `${t.h * 0.4}vh`,
              background: "var(--bark)",
              marginLeft: `-${t.w * 0.175}vh`,
              opacity: 0.75,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function ForestBackground() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();

  const yFar = useTransform(scrollYProgress, [0, 1], ["0vh", "-6vh"]);
  const yMid = useTransform(scrollYProgress, [0, 1], ["0vh", "-14vh"]);
  const yNear = useTransform(scrollYProgress, [0, 1], ["0vh", "-26vh"]);

  useEffect(() => setMounted(true), []);

  const leaves = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        left: rand(0, 100),
        size: rand(14, 30),
        delay: rand(0, 18),
        duration: rand(22, 40),
        drift: rand(-140, 140),
        spin: rand(180, 540),
        opacity: rand(0.25, 0.6),
      })),
    [],
  );

  const butterflies = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        top: rand(10, 80),
        left: rand(5, 90),
        size: rand(18, 30),
        delay: rand(0, 8),
        duration: rand(16, 28),
        path: Array.from({ length: 4 }, () => ({ x: rand(-220, 220), y: rand(-160, 160) })),
      })),
    [],
  );

  const wind = useMemo(
    () =>
      Array.from({ length: 22 }, () => ({
        top: rand(0, 100),
        size: rand(2, 4),
        delay: rand(0, 14),
        duration: rand(10, 22),
      })),
    [],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* sky */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, var(--sky-top), var(--sky-bottom))" }}
      />
      {/* soft sun / moon glow */}
      <div
        className="absolute right-[12%] top-[8%] h-64 w-64 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)", opacity: 0.28 }}
      />

      {/* parallax tree layers */}
      <motion.div className="absolute inset-0" style={{ y: reduce ? 0 : yFar, opacity: 0.55 }}>
        <TreeLine fill="var(--tree-far)" height={42} count={16} seed={3} />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ y: reduce ? 0 : yMid, opacity: 0.75 }}>
        <TreeLine fill="var(--tree-mid)" height={32} count={11} seed={7} />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ y: reduce ? 0 : yNear }}>
        <TreeLine fill="var(--tree-near)" height={22} count={8} seed={11} />
      </motion.div>

      {/* ground band */}
      <div
        className="absolute inset-x-0 bottom-0 h-[8vh]"
        style={{ background: "linear-gradient(180deg, transparent, var(--ground))", opacity: 0.5 }}
      />

      {mounted && !reduce && (
        <>
          {/* wind particles */}
          {wind.map((w, i) => (
            <motion.span
              key={`w${i}`}
              className="absolute rounded-full"
              style={{
                top: `${w.top}%`,
                left: "-5%",
                width: w.size,
                height: w.size,
                background: "var(--silk)",
                opacity: 0.25,
              }}
              animate={{ x: ["0vw", "110vw"], y: [0, -30, 20, 0] }}
              transition={{ duration: w.duration, delay: w.delay, repeat: Infinity, ease: "linear" }}
            />
          ))}

          {/* floating leaves */}
          {leaves.map((l, i) => (
            <motion.div
              key={`l${i}`}
              className="absolute"
              style={{ left: `${l.left}%`, top: "-8%", width: l.size, height: l.size, opacity: l.opacity }}
              animate={{ y: ["0vh", "112vh"], x: [0, l.drift, -l.drift / 2, l.drift / 3], rotate: [0, l.spin] }}
              transition={{ duration: l.duration, delay: l.delay, repeat: Infinity, ease: "linear" }}
            >
              <PixelLeaf className="h-full w-full" />
            </motion.div>
          ))}

          {/* butterflies */}
          {butterflies.map((b, i) => (
            <motion.div
              key={`b${i}`}
              className="absolute"
              style={{ top: `${b.top}%`, left: `${b.left}%`, width: b.size, height: b.size }}
              animate={{
                x: [0, ...b.path.map((p) => p.x), 0],
                y: [0, ...b.path.map((p) => p.y), 0],
              }}
              transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ scaleX: [1, 0.55, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <PixelButterfly className="h-full w-full" style={{ opacity: 0.8 }} />
              </motion.div>
            </motion.div>
          ))}

          {/* occasional caterpillar crawling across a leaf */}
          <motion.div
            className="absolute"
            style={{ top: "62%", width: 44, height: 44 }}
            animate={{ x: ["-6vw", "106vw"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 46, repeat: Infinity, repeatDelay: 24, ease: "linear", times: [0, 0.05, 0.95, 1] }}
          >
            <motion.div
              animate={{ scaleX: [1, 0.88, 1], y: [0, -3, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            >
              <PixelCaterpillar className="h-full w-full" style={{ opacity: 0.55 }} />
            </motion.div>
          </motion.div>
        </>
      )}
    </div>
  );
}