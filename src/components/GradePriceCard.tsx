import { motion } from "motion/react";
import type { GradeEstimate } from "@/lib/api";

interface Props {
  estimate?: GradeEstimate;
}

export function GradePriceCard({ estimate }: Props) {
  if (!estimate) return null;

  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/50" },
    B: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/50" },
    C: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/50" },
    D: { bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/50" },
  };

  const style = gradeColors[estimate.grade_code] || {
    bg: "bg-primary/20",
    text: "text-primary-foreground",
    border: "border-primary/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass overflow-hidden rounded-2xl p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Grade Badge */}
        <div>
          <span className="pixel text-[10px] uppercase tracking-wider text-muted-foreground">Overall Tray Grade</span>
          <div className="mt-2 flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 ${style.border} ${style.bg} backdrop-blur-md`}
            >
              <span className={`pixel text-xl font-bold ${style.text}`}>{estimate.grade_code}</span>
            </div>
            <div>
              <h4 className="pixel text-sm text-foreground">{estimate.grade}</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">Based on normal cocoon ratio</p>
            </div>
          </div>
        </div>

        {/* Demo Price Estimation */}
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-left sm:text-right">
          <div className="flex items-center gap-1.5 sm:justify-end">
            <span className="pixel text-[9px] uppercase tracking-wider text-accent">Demo Price Estimate</span>
            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[8px] font-semibold text-accent-foreground">
              Demo Rule
            </span>
          </div>
          <p className="pixel mt-1 text-2xl text-foreground text-glow">
            ₹{estimate.estimated_price_demo.toFixed(2)}
          </p>
          <p className="mt-1 text-[10px] italic text-muted-foreground">
            {estimate.disclaimer}
          </p>
        </div>
      </div>

      {/* Color Legend */}
      <div className="mt-6 border-t border-border/60 pt-4">
        <p className="pixel mb-2.5 text-[10px] uppercase tracking-wider text-muted-foreground">Mask Overlay Legend</p>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-foreground">Fugongiya</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="text-foreground">Sunken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-foreground">Surface Defect</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
