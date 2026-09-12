import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDownRight, ArrowUpRight, FileImage, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  classifySegmentedCocoons,
  segmentCocoonTrayImage,
  type BackendAnalyzeResponse,
  type SegmentResponse,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cocoon / Vision Lab" },
      { name: "description", content: "A staged silk cocoon computer-vision instrument." },
    ],
  }),
  component: Index,
});

type Stage = "ready" | "counting" | "counted" | "grading" | "complete";
const labels: Record<string, string> = {
  normal: "NORMAL",
  fugongiya: "FUGONGIYA",
  sunken: "SUNKEN",
  surface_defect: "SURFACE DEFECT",
  unclassified: "UNCLASSIFIED",
};
const workflow = [
  ["01", "INPUT", "Tray photograph enters the instrument."],
  ["02", "COUNT", "YOLOv11 finds every individual instance."],
  ["03", "ISOLATE", "Each detected mask becomes one exact crop."],
  ["04", "QUALITY", "ResNet18 runs only when requested."],
  ["05", "GRADE", "Observed quality becomes one tray grade."],
  ["06", "VALUE", "A configurable demonstration estimate appears."],
];

function Count({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1000, 1);
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);
  return <>{shown.toString().padStart(2, "0")}</>;
}

function FileDrop({ onFile }: { onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const receive = (file?: File) => {
    if (file?.type.startsWith("image/")) onFile(file);
  };
  return (
    <div
      className={`drop-zone ${drag ? "is-dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        receive(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => receive(e.target.files?.[0])}
      />
      <FileImage strokeWidth={1.15} size={34} />
      <p>Place a tray in the field</p>
      <span>JPG, PNG OR WEBP</span>
      <button type="button" className="text-button" onClick={() => input.current?.click()}>
        Choose photograph <ArrowUpRight size={15} />
      </button>
    </div>
  );
}

function StageRail({ stage }: { stage: Stage }) {
  const passed = stage === "counted" || stage === "grading" || stage === "complete";
  return (
    <div className="stage-rail" aria-label="Analysis stages">
      <div className="rail-step active">
        <span>01</span>
        <b>Count</b>
        <small>YOLOv11 segmentation</small>
      </div>
      <i className={passed ? "filled" : ""} />
      <div className={passed ? "rail-step active" : "rail-step"}>
        <span>02</span>
        <b>Quality</b>
        <small>ResNet18 classification</small>
      </div>
    </div>
  );
}

function ScrollStory() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const travel = useTransform(scrollYProgress, [0.08, 0.86], ["0%", "100%"]);
  const visualY = useTransform(scrollYProgress, [0, 0.5, 1], [120, 0, -160]);
  const visualScale = useTransform(scrollYProgress, [0, 0.48, 1], [0.78, 1.12, 0.7]);
  const visualRotate = useTransform(scrollYProgress, [0, 1], [-14, 18]);
  const threadWidth = useTransform(scrollYProgress, [0.05, 0.9], ["0%", "100%"]);
  return (
    <>
      <section className="workflow-intro workflow-choreography" ref={ref} id="workflow">
        <div className="workflow-opening">
          <div className="section-kicker">Instrument sequence / 06 movements</div>
          <h2>
            ONE TRAY.
            <br />
            SIX <em>READINGS.</em>
          </h2>
          <p>Follow the object through a deliberate visual system. Count settles first; quality is an explicit second move.</p>
        </div>
        <div className="workflow-visual" aria-hidden="true">
          <motion.i className="workflow-thread" style={reduce ? undefined : { width: threadWidth }} />
          <motion.div className="workflow-orbit" style={reduce ? undefined : { y: visualY, scale: visualScale, rotate: visualRotate }}>
            <span /><span /><span /><b>01<br /><small>FIELD / TRACE</small></b>
          </motion.div>
          <motion.span className="workflow-traveler" style={reduce ? undefined : { top: travel }} />
        </div>
        <div className="workflow-list">
          {workflow.map(([number, title, copy], index) => (
            <motion.article
              key={title}
              className="workflow-step"
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.05, duration: 0.55 }}
            >
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p><small>{index === 1 ? "YOLOv11 / INSTANCE SEGMENTATION" : index === 3 ? "RESNET18 / ON EXPLICIT REQUEST" : "COCOON VISION / INSTRUMENT LOG"}</small>
              <i />
            </motion.article>
          ))}
        </div>
      </section>
      <section className="architecture" id="method">
        <div className="architecture-copy">
          <p className="eyebrow">A deliberate boundary</p>
          <h2>
            ONE IMAGE.
            <br />
            <em>TWO MODELS.</em>
          </h2>
          <p>
            YOLOv11 owns the count. It creates the only set of cocoon masks and crops. ResNet18 does
            not look at the tray until the operator asks for quality analysis—and it cannot add or
            remove cocoons.
          </p>
          <div className="architecture-notes">
            <span>COUNT AUTHORITY / YOLOv11</span>
            <span>QUALITY READING / RESNET18</span>
          </div>
        </div>
        <div className="model-stage">
          <motion.div
            className="model-raw"
            initial={{ opacity: 0, rotate: -4 }}
            whileInView={{ opacity: 1, rotate: -2 }}
            viewport={{ once: true }}
          >
            <div className="mini-cocoons">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <small>RAW TRAY</small>
          </motion.div>
          <motion.div
            className="model-masks"
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
          >
            <div>
              <i />
              <i />
              <i />
              <i />
            </div>
            <small>INSTANCE MASKS</small>
          </motion.div>
          <motion.div
            className="model-crops"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
          >
            <i />
            <i />
            <i />
            <i />
            <small>EXACT CROPS</small>
          </motion.div>
          <motion.div
            className="model-states"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <span>NORMAL</span>
            <span>FUGONGIYA</span>
            <span>SUNKEN</span>
            <span>SURFACE DEFECT</span>
          </motion.div>
        </div>
      </section>
      <section className="method-note">
        <p className="eyebrow">What this instrument does</p>
        <h2>
          OBSERVE.
          <br />
          DON’T <em>INVENT.</em>
        </h2>
        <div>
          <p>
            It segments visible cocoons in a tray image, preserves those instance boundaries, and
            optionally classifies the resulting isolated crops. An unavailable classification is
            reported as unclassified; the count remains unchanged.
          </p>
          <small>
            Results are a visual-assistance workflow. The value is a configurable demo estimate, not
            a market quote.
          </small>
        </div>
      </section>
    </>
  );
}

function ProcessingFrame({
  image,
  kind,
  compact = false,
}: {
  image: string | null;
  kind: "count" | "quality";
  compact?: boolean;
}) {
  const [message, setMessage] = useState(0);
  const words =
    kind === "count"
      ? ["MAPPING TRAY", "VISION PASS", "DETECTING INSTANCES", "SEPARATING OBJECTS", "COUNT COMPLETE"]
      : [
          "PREPARING MASK-ISOLATED CROPS",
          "RUNNING QUALITY CLASSIFICATION",
          "COMPILING QUALITY REPORT",
        ];
  useEffect(() => {
    const timer = window.setInterval(() => setMessage((v) => (v + 1) % words.length), 1800);
    return () => window.clearInterval(timer);
  }, [words.length]);
  return (
    <div className={`processing cinematic-processing ${compact ? "compact" : ""}`}>
      <div className="processing-image">
        {image ? (
          <img src={image} alt="Tray being processed" />
        ) : (
          <div className="scan-placeholder" />
        )}
        <div className="scan-grid" />
        <motion.i
          className="scan-beam"
          animate={{ top: ["4%", "94%", "4%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="corner c1" />
        <span className="corner c2" />
        <span className="corner c3" />
        <span className="corner c4" />
        <div className="hud top-hud">
          {kind === "count" ? "INSTANCE SEGMENTATION / VISION PASS" : "QUALITY ANALYSIS / RESNET18"}
        </div>
        <div className="hud bottom-hud">LIVE REQUEST · AWAITING MODEL RESPONSE</div>
        {kind === "quality" && (
          <div className="quality-orbs">
            <i />
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
      <div className="processing-copy">
        <p className="eyebrow">{kind === "count" ? "Stage 01 / YOLOv11" : "Stage 02 / ResNet18"}</p>
        <AnimatePresence mode="wait">
          <motion.h3
            key={words[message]}
            initial={{ opacity: 0, y: 9 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -9 }}
          >
            {words[message]}.
          </motion.h3>
        </AnimatePresence>
        <p>
          {kind === "count"
            ? "The visual sequence represents the waiting period. The count appears only after the segmentation response arrives."
            : "This interface does not invent per-cocoon progress: the report appears when the classification response has completed."}
        </p>
      </div>
    </div>
  );
}

function Index() {
  const [stage, setStage] = useState<Stage>("ready");
  const [segment, setSegment] = useState<SegmentResponse | null>(null);
  const [graded, setGraded] = useState<BackendAnalyzeResponse | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 650], [0, 110]);
  const heroOpacity = useTransform(scrollY, [0, 550], [1, 0.2]);
  const heroOrbitScale = useTransform(scrollY, [0, 520], [1, 1.16]);
  const heroLabelX = useTransform(scrollY, [0, 520], [0, 78]);
  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );
  const count = useCallback(async (file: File) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setOriginal(objectUrl.current);
    setError(null);
    setGraded(null);
    setStage("counting");
    try {
      setSegment(await segmentCocoonTrayImage(file));
      setStage("counted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to run segmentation.");
      setStage("ready");
    }
  }, []);
  const grade = useCallback(async () => {
    if (!segment) return;
    setError(null);
    setStage("grading");
    try {
      setGraded(await classifySegmentedCocoons(segment.analysis_id));
      setStage("complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quality analysis could not be completed.");
      setStage("counted");
    }
  }, [segment]);
  const reset = () => {
    setStage("ready");
    setSegment(null);
    setGraded(null);
    setError(null);
    document.querySelector("#analyze")?.scrollIntoView({ behavior: "smooth" });
  };
  const display = graded ?? segment;
  return (
    <div className="lab-shell">
      <div className="fiber-field" />
      <nav>
        <a className="mark" href="#top">
          <i />
          <span>
            COCOON
            <br />
            VISION
          </span>
        </a>
        <div className="nav-links">
          <a href="#analyze">Analyze</a>
          <a href="#workflow">Workflow</a>
          <a href="#method">Method</a>
        </div>
        <span className="live-dot">SYSTEM READY</span>
      </nav>
      <main id="top">
        <section className="hero">
          <motion.div className="hero-copy" style={{ y: heroY, opacity: heroOpacity }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow">
              Silk quality, made visible
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              SEE THE
              <br />
              <em>WHOLE</em> THREAD.
            </motion.h1>
            <p className="lede">
              A two-stage visual instrument for counting cocoons with precision, then reading their
              quality—only when you ask it to.
            </p>
            <a className="hero-link" href="#analyze">
              Begin an analysis <ArrowDownRight size={19} />
            </a>
          </motion.div>
          <motion.div
            className="cocoon-orbit"
            style={{ y: heroY, scale: heroOrbitScale }}
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          >
            <span />
            <span />
            <span />
            <b>
              01
              <br />
              <small>TRAY / SCAN</small>
            </b>
          </motion.div>
          <motion.span className="hero-metadata hero-metadata-a" style={{ x: heroLabelX }}>
            24.61° N / VISION FIELD
          </motion.span>
          <motion.span className="hero-metadata hero-metadata-b" style={{ x: heroLabelX }}>
            01—02 / DELIBERATE MOVES
          </motion.span>
          <motion.i className="hero-thread" style={{ scaleX: heroOrbitScale }} />
        </section>
        <ScrollStory />
        <section id="analyze" className="instrument">
          <div className="instrument-head">
            <div>
              <p className="eyebrow">Analysis chamber</p>
              <h2>
                ONE TRAY.
                <br />
                TWO DELIBERATE MOVES.
              </h2>
            </div>
            <StageRail stage={stage} />
          </div>
          {error && (
            <div className="error">
              <X size={17} />
              {error}
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {stage === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="upload-layout"
              >
                <div className="protocol">
                  <span>Protocol / 01</span>
                  <h3>Count what is present.</h3>
                  <p>
                    YOLOv11 creates one mask for every cocoon it sees. That count remains
                    authoritative throughout the report.
                  </p>
                  <div className="rule" />
                  <small>QUALITY MODEL IS NOT CALLED AT THIS STAGE</small>
                </div>
                <FileDrop onFile={count} />
              </motion.div>
            )}
            {stage === "counting" && <ProcessingFrame image={original} kind="count" />}
            {(stage === "counted" || stage === "grading" || stage === "complete") && display && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="result-layout"
              >
                <div className="vision-panel">
                  <img
                    src={stage === "complete" ? graded?.segmented_image : segment?.segmented_image}
                    alt="YOLO segmentation overlay of the uploaded tray"
                  />
                  <div className="reticle r1" />
                  <div className="reticle r2" />
                  <div className="panel-label">
                    {stage === "complete" ? "QUALITY OVERLAY" : "YOLOv11 MASK FIELD"}
                  </div>
                </div>
                <div className="readout">
                  <p className="eyebrow">
                    {stage === "complete" ? "Final report" : "Counting complete"}
                  </p>
                  <div className="count-number">
                    <Count value={display.count} />
                  </div>
                  <h3>
                    COCOONS
                    <br />
                    DETECTED
                  </h3>
                  <p className="support">
                    {display.average_confidence.toFixed(1)}% mean detection confidence ·{" "}
                    {segment?.processing_ms ? `${(segment.processing_ms / 1000).toFixed(1)}s` : ""}
                  </p>
                  {stage === "counted" && (
                    <div className="next-stage">
                      <span>Count complete / Stage 02 is optional</span>
                      <p>
                        {display.count} detected instances are ready for quality analysis. ResNet18
                        receives these exact YOLO-generated, mask-isolated crops; the count will not change.
                      </p>
                      <button className="primary-action" onClick={grade}>
                        Run quality analysis <ArrowUpRight size={17} />
                      </button>
                    </div>
                  )}
                  {stage === "grading" && (
                    <ProcessingFrame
                      image={segment?.segmented_image ?? original}
                      kind="quality"
                      compact
                    />
                  )}
                  {stage === "complete" && graded && (
                    <QualityReport result={graded} onReset={reset} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <section className="closing-cta">
          <p className="eyebrow">The tray is waiting</p>
          <h2>
            MAKE THE
            <br />
            <em>INVISIBLE</em> LEGIBLE.
          </h2>
          <a className="primary-action" href="#analyze">
            Open the instrument <ArrowDownRight size={17} />
          </a>
        </section>
      </main>
      <footer>
        <span>COCOON VISION LAB</span>
        <span>Built around the real inference pipeline</span>
      </footer>
    </div>
  );
}

function QualityReport({
  result,
  onReset,
}: {
  result: BackendAnalyzeResponse;
  onReset: () => void;
}) {
  const items = Object.entries(result.quality_breakdown).filter(([, stat]) => stat.count > 0);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="quality-report">
      <div className="grade">
        <span>TRAY GRADE</span>
        <strong>{result.grade_estimate.grade_code}</strong>
        <b>{result.grade_estimate.grade}</b>
      </div>
      <div className="distribution">
        <span>QUALITY COMPOSITION</span>
        {items.map(([key, stat]) => (
          <div className="bar" key={key}>
            <label>
              {labels[key]} <b>{stat.count}</b>
            </label>
            <i>
              <motion.em
                initial={{ width: 0 }}
                animate={{ width: `${stat.percentage}%` }}
                transition={{ duration: 0.8 }}
              />
            </i>
            <small>{stat.percentage}%</small>
          </div>
        ))}
      </div>
      <div className="price">
        <span>DEMO VALUE</span>
        <strong>₹{result.grade_estimate.estimated_price_demo.toFixed(2)}</strong>
        <small>
          {result.classification_success_rate}% classified ·{" "}
          {result.quality_breakdown.unclassified.count} unclassified
        </small>
      </div>
      <button className="text-button" onClick={onReset}>
        Analyze another tray <ArrowUpRight size={15} />
      </button>
    </motion.div>
  );
}
