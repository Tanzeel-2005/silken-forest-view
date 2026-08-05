import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { PixelCaterpillar, PixelLeaf } from "./pixel/PixelIcons";

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 11;
        if (next >= 100) {
          window.clearInterval(id);
          window.setTimeout(onDone, 550);
          return 100;
        }
        return next;
      });
    }, 220);
    return () => window.clearInterval(id);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      style={{ background: "linear-gradient(180deg, var(--sky-top), var(--sky-bottom))" }}
    >
      <div className="glass w-full max-w-lg rounded-2xl p-7 text-center sm:p-10">
        <h2 className="pixel text-xs text-foreground sm:text-sm">Teaching AI about silk cocoons...</h2>

        {/* leaf runway with crawling caterpillar */}
        <div className="relative mt-9 h-16">
          <div className="absolute inset-x-0 bottom-3 h-1.5 rounded-full bg-muted" />
          <motion.div
            className="absolute bottom-3 h-11 w-11"
            animate={{ left: `${Math.min(progress, 100)}%` }}
            transition={{ type: "spring", stiffness: 40, damping: 14 }}
            style={{ translateX: "-50%" }}
          >
            <motion.div
              animate={{ scaleX: [1, 0.85, 1], y: [0, -4, 0] }}
              transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
            >
              <PixelCaterpillar className="h-full w-full" />
            </motion.div>
          </motion.div>
          <div className="absolute bottom-1 right-0 h-8 w-8">
            <PixelLeaf className="h-full w-full" />
          </div>
        </div>

        <div className="mt-2 h-4 w-full overflow-hidden rounded-full border border-border bg-secondary/70">
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(90deg, var(--moss), var(--leaf), var(--gold))" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.3 }}
          />
        </div>
        <p className="pixel mt-4 text-[10px] text-muted-foreground">{Math.round(progress)}% woven</p>
      </div>
    </motion.div>
  );
}