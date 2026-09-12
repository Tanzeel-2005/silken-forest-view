import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import sampleOriginal from "@/assets/sample-original.jpg";
import sampleSegmented from "@/assets/sample-segmented.jpg";
import type { GradeEstimate, QualityBreakdown } from "@/lib/api";
import { GradePriceCard } from "./GradePriceCard";
import { PixelBolt, PixelCount, PixelDownload, PixelEye, PixelUpload } from "./pixel/PixelIcons";
import { QualityBreakdownCard } from "./QualityBreakdownCard";

export type AnalysisResult = {
  cocoons: number;
  confidence: number;
  processingMs: number;
  originalUrl: string | null;
  segmentedUrl: string;
  qualityBreakdown?: QualityBreakdown;
  classificationSuccessRate?: number;
  gradeEstimate?: GradeEstimate;
};

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

function StatCard({
  label,
  value,
  suffix,
  decimals = 0,
  Icon,
  delay,
}: {
  label: string;
  value: number;
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
        {shown.toFixed(decimals)}
        {suffix}
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

export function ResultView({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  const segmentedSrc = result.segmentedUrl || sampleSegmented;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Side-by-side original vs segmented view */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ImagePanel
          title="Original Tray Image"
          src={result.originalUrl ?? sampleOriginal}
          alt="Uploaded silk cocoon tray photograph"
          delay={0}
        />
        <ImagePanel
          title="Quality Color-Coded Segmentation Overlay"
          src={segmentedSrc}
          alt="Color-coded quality segmentation masks drawn over each detected silk cocoon"
          delay={0.12}
        />
      </div>

      {/* Grade and Demo Price Card */}
      {result.gradeEstimate && <GradePriceCard estimate={result.gradeEstimate} />}

      {/* Primary Overview Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Total Cocoons (YOLOv11)" value={result.cocoons} Icon={PixelCount} delay={0.2} />
        <StatCard
          label="Avg Detection Confidence"
          value={result.confidence}
          suffix="%"
          decimals={1}
          Icon={PixelEye}
          delay={0.3}
        />
        <StatCard
          label="Total Processing Time"
          value={result.processingMs / 1000}
          suffix="s"
          decimals={2}
          Icon={PixelBolt}
          delay={0.4}
        />
      </div>

      {/* ResNet18 Quality Class Distribution */}
      {result.qualityBreakdown && (
        <QualityBreakdownCard
          breakdown={result.qualityBreakdown}
          totalCount={result.cocoons}
          successRate={result.classificationSuccessRate}
        />
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-center">
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