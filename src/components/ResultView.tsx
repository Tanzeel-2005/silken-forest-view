import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import sampleOriginal from "@/assets/sample-original.jpg";
import sampleSegmented from "@/assets/sample-segmented.jpg";
import { PixelBolt, PixelCount, PixelDownload, PixelEye, PixelUpload } from "./pixel/PixelIcons";

// --- Types ---
export type CocoonData = {
  id: number;
  grade: string;
  confidence: number;
  features: { area: number; length: number; width: number; aspect_ratio: number };
  estimated_price: number;
};

export type AnalysisResult = {
  count: number;
  average_confidence: number;
  processing_ms: number;
  originalUrl: string | null;
  segmented_image: string; // Base64 from backend
  grade_counts: Record<string, number>;
  total_estimated_price: number;
  cocoons: CocoonData[];
};

// --- Animation Hook ---
function useCountUp(target: number, decimals = 0) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const duration = 1100;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Number((target * eased).toFixed(decimals)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, decimals, reduce]);

  return value;
}

// --- Reusable Components ---
function StatCard({
  label,
  value,
  prefix = "",
  suffix,
  decimals = 0,
  Icon,
  delay,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  Icon: (p: { className?: string }) => React.ReactElement;
  delay: number;
}) {
  const shown = useCountUp(value, decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      className="glass relative overflow-hidden rounded-2xl p-6"
    >
      <motion.div
        className="h-10 w-10"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="h-full w-full" />
      </motion.div>
      <p className="pixel mt-4 text-lg text-foreground text-glow sm:text-xl">
        {prefix}{shown.toFixed(decimals)}{suffix}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </motion.div>
  );
}

function ImagePanel({
  title,
  src,
  alt,
  delay,
}: {
  title: string;
  src: string;
  alt: string;
  delay: number;
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, x: delay > 0 ? 24 : -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="glass overflow-hidden rounded-2xl"
    >
      <figcaption className="pixel border-b border-border/70 px-4 py-3 text-[10px] text-foreground">
        {title}
      </figcaption>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={1024}
        height={768}
        className="aspect-[4/3] w-full object-cover"
      />
    </motion.figure>
  );
}

// --- Main Component ---
export function ResultView({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  // Fallback to sample images if URLs are missing
  const segmentedSrc = result.segmented_image || sampleSegmented;
  const originalSrc = result.originalUrl || sampleOriginal;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Image Comparison Panels */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ImagePanel
          title="Original Image"
          src={originalSrc}
          alt="Uploaded silk cocoon tray photograph"
          delay={0}
        />
        <ImagePanel
          title="Segmented Image"
          src={segmentedSrc}
          alt="Segmentation masks drawn over each detected silk cocoon"
          delay={0.12}
        />
      </div>

      {/* 2. Top-Level Statistics */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Cocoons" value={result.count} Icon={PixelCount} delay={0.2} />
        <StatCard
          label="Avg Confidence"
          value={result.average_confidence}
          suffix="%"
          decimals={1}
          Icon={PixelEye}
          delay={0.3}
        />
        <StatCard
          label="Processing Time"
          value={result.processing_ms / 1000}
          suffix="s"
          decimals={2}
          Icon={PixelBolt}
          delay={0.4}
        />
        <StatCard
          label="Est. Total Price"
          value={result.total_estimated_price}
          prefix="$"
          decimals={2}
          Icon={PixelBolt} // Reusing PixelBolt for price, or swap with a custom icon if you have one
          delay={0.5}
        />
      </div>

      {/* 3. Grade Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="pixel mb-4 text-lg text-foreground text-glow">Quality Breakdown</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(result.grade_counts).map(([grade, count]) => (
            <div
              key={grade}
              className="flex min-w-[120px] flex-col items-center justify-center rounded-xl border border-border/50 bg-black/20 p-4"
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {grade}
              </span>
              <span className="pixel mt-2 text-2xl text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 4. Detailed Individual Cocoon Table */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
        className="glass overflow-hidden rounded-2xl"
      >
        <div className="border-b border-border/70 px-6 py-4">
          <h3 className="pixel text-lg text-foreground text-glow">Individual Cocoon Analysis</h3>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-black/20 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="rounded-tl-lg px-4 py-3">ID</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Area (px)</th>
                <th className="px-4 py-3">Aspect Ratio</th>
                <th className="rounded-tr-lg px-4 py-3">Est. Price</th>
              </tr>
            </thead>
            <tbody>
              {result.cocoons.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/30 transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-foreground">{c.id}</td>
                  <td className="px-4 py-3 font-medium capitalize text-foreground">{c.grade}</td>
                  <td className="px-4 py-3">{(c.confidence * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">{c.features.area}</td>
                  <td className="px-4 py-3">{c.features.aspect_ratio}</td>
                  <td className="px-4 py-3 font-semibold text-green-400">
                    ${c.estimated_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 5. Action Buttons */}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <motion.button
          type="button"
          onClick={onReset}
          whileHover={{ y: -2 }}
          whileTap={{ y: 1 }}
          className="pixel inline-flex items-center justify-center gap-3 rounded-lg border-2 border-forest bg-primary px-6 py-4 text-[11px] text-primary-foreground shadow-[4px_4px_0_0_var(--bark)]"
        >
          <PixelUpload className="h-5 w-5" />
          Analyze Another Image
        </motion.button>
        <motion.a
          href={segmentedSrc}
          download="silk-cocoon-ai-result.jpg"
          whileHover={{ y: -2 }}
          whileTap={{ y: 1 }}
          className="pixel inline-flex items-center justify-center gap-3 rounded-lg border-2 border-border bg-secondary px-6 py-4 text-[11px] text-secondary-foreground shadow-[4px_4px_0_0_var(--bark)]"
        >
          <PixelDownload className="h-5 w-5" />
          Download Result
        </motion.a>
      </div>
    </div>
  );
}