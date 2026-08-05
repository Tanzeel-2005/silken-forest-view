import { motion } from "motion/react";
import type { ComponentType, SVGProps } from "react";

import { PixelBolt, PixelCount, PixelEye, PixelLeaf, PixelSprout } from "./pixel/PixelIcons";

type Feature = {
  title: string;
  body: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const features: Feature[] = [
  {
    title: "Instance Segmentation",
    body: "Every cocoon gets its own mask, even when they overlap on a crowded mulberry tray.",
    Icon: PixelLeaf,
  },
  {
    title: "AI Detection",
    body: "A vision model trained on silk farm imagery spots cocoons in mixed light and clutter.",
    Icon: PixelEye,
  },
  {
    title: "Accurate Counting",
    body: "Counts stay steady across trays, so yield tracking no longer means counting by hand.",
    Icon: PixelCount,
  },
  {
    title: "Fast Processing",
    body: "Results in under a second per frame, light enough to run beside the rearing racks.",
    Icon: PixelBolt,
  },
];

export function FeatureCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((f, i) => (
        <motion.article
          key={f.title}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: i * 0.09, ease: "easeOut" }}
          whileHover={{ y: -6 }}
          className="glass group relative overflow-hidden rounded-2xl p-6"
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg, var(--moss), var(--leaf), var(--gold))" }}
          />
          <motion.div
            className="h-12 w-12"
            animate={{ y: [0, -5, 0], rotate: [0, 4, -4, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            <f.Icon className="h-full w-full" />
          </motion.div>
          <h3 className="pixel mt-5 text-[11px] leading-relaxed text-foreground">{f.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>

          <motion.div
            className="pointer-events-none absolute -bottom-2 -right-2 h-12 w-12 opacity-0 group-hover:opacity-70"
            animate={{ rotate: [0, 12, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <PixelSprout className="h-full w-full" />
          </motion.div>
        </motion.article>
      ))}
    </div>
  );
}