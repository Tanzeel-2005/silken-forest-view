import { motion } from "motion/react";
import type { QualityBreakdown } from "@/lib/api";

interface Props {
  breakdown: QualityBreakdown;
  totalCount: number;
  successRate?: number;
}

export function QualityBreakdownCard({ breakdown, totalCount, successRate = 100 }: Props) {
  const classes = [
    {
      key: "normal",
      label: "Normal Cocoons",
      stat: breakdown.normal,
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/40",
      bgColor: "bg-emerald-500/10",
      dot: "#10b981",
    },
    {
      key: "fugongiya",
      label: "Fugongiya (Flawed)",
      stat: breakdown.fugongiya,
      color: "bg-purple-500",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/40",
      bgColor: "bg-purple-500/10",
      dot: "#8b5cf6",
    },
    {
      key: "sunken",
      label: "Sunken Cocoons",
      stat: breakdown.sunken,
      color: "bg-rose-500",
      textColor: "text-rose-400",
      borderColor: "border-rose-500/40",
      bgColor: "bg-rose-500/10",
      dot: "#f43f5e",
    },
    {
      key: "surface_defect",
      label: "Surface Defects",
      stat: breakdown.surface_defect,
      color: "bg-amber-500",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/40",
      bgColor: "bg-amber-500/10",
      dot: "#f59e0b",
    },
  ];

  const hasUnclassified = breakdown.unclassified && breakdown.unclassified.count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass overflow-hidden rounded-2xl p-6"
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h3 className="pixel text-sm text-foreground text-glow">ResNet18 Quality Distribution</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Classified across {totalCount} YOLO-detected cocoon masks
          </p>
        </div>
        <div className="text-right">
          <span className="pixel text-[10px] uppercase tracking-wider text-accent">Classification Rate</span>
          <p className="pixel text-sm text-foreground">{successRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {classes.map((item) => (
          <div
            key={item.key}
            className={`rounded-xl border ${item.borderColor} ${item.bgColor} p-4 backdrop-blur-xs`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full shadow-xs" style={{ backgroundColor: item.dot }} />
                <span className="pixel text-[11px] text-foreground">{item.label}</span>
              </div>
              <span className={`pixel text-sm font-bold ${item.textColor}`}>{item.stat.count}</span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Proportion</span>
                <span className="font-semibold text-foreground">{item.stat.percentage}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary/80">
                <motion.div
                  className={`h-full ${item.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, item.stat.percentage)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasUnclassified && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-500/40 bg-slate-500/10 px-4 py-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span>Unclassified / Network Timeout:</span>
          </div>
          <span className="font-mono font-bold">
            {breakdown.unclassified.count} ({breakdown.unclassified.percentage}% of total YOLO count)
          </span>
        </div>
      )}
    </motion.div>
  );
}
