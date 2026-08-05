import { motion, useReducedMotion } from "motion/react";

import { PixelButterfly, PixelCocoon } from "./pixel/PixelIcons";

type Props = {
  /** length of the silk thread in px */
  thread?: number;
  size?: number;
  delay?: number;
  /** this cocoon slowly metamorphoses into a butterfly */
  metamorphose?: boolean;
};

export function HangingCocoon({ thread = 56, size = 64, delay = 0, metamorphose = false }: Props) {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col items-center">
      <div className="w-px" style={{ height: thread, background: "var(--moss)", opacity: 0.7 }} />
      <motion.div
        className="origin-top"
        style={{ width: size, height: size }}
        animate={reduce ? undefined : { rotate: [-3.5, 3.5, -3.5] }}
        transition={{ duration: 4.5, delay, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ rotate: [-11, 11, -7, 7, 0], transition: { duration: 1.4 } }}
      >
        {metamorphose ? (
          <div className="relative h-full w-full">
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [1, 1, 0, 0, 1], scale: [1, 1.06, 0.9, 0.9, 1] }}
              transition={{ duration: 12, repeat: Infinity, times: [0, 0.42, 0.5, 0.9, 1] }}
            >
              <PixelCocoon className="h-full w-full drop-shadow-[0_0_16px_var(--gold)]" />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0, 0, 1, 1, 0], y: [0, 0, -14, -26, 0], scale: [0.7, 0.7, 1, 1.05, 0.7] }}
              transition={{ duration: 12, repeat: Infinity, times: [0, 0.46, 0.56, 0.9, 1] }}
            >
              <motion.div
                animate={{ scaleX: [1, 0.6, 1] }}
                transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-full"
              >
                <PixelButterfly className="h-full w-full" />
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <PixelCocoon className="h-full w-full" />
        )}
      </motion.div>
    </div>
  );
}

export function CocoonBranch({ className = "" }: { className?: string }) {
  return (
    <div className={`relative select-none ${className}`}>
      {/* branch */}
      <div className="wood-grain h-3 w-full rounded-full shadow-[0_4px_0_0_oklch(0.3_0.05_55)]" />
      <div className="flex justify-around px-4">
        <HangingCocoon thread={70} size={54} delay={0.2} />
        <HangingCocoon thread={44} size={66} delay={1.1} metamorphose />
        <HangingCocoon thread={92} size={46} delay={0.6} />
      </div>
    </div>
  );
}