import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FeatureCards } from "@/components/FeatureCards";
import { Footer } from "@/components/Footer";
import { ForestBackground } from "@/components/ForestBackground";
import { CocoonBranch } from "@/components/HangingCocoon";
import { LeafTransition } from "@/components/LeafTransition";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Navbar } from "@/components/Navbar";
import { ResultView, type AnalysisResult } from "@/components/ResultView";
import { AboutSection, DocumentationSection, Section, TechnologySection } from "@/components/Sections";
import { UploadArea } from "@/components/UploadArea";

const title = "Silk Cocoon AI — AI Powered Cocoon Segmentation & Analysis";
const description =
  "A cozy pixel-forest studio for silk farms: upload a tray photo and get per-cocoon segmentation, counts and confidence scores.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "idle" | "loading" | "result";

function Index() {
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const objectUrl = useRef<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  const handleFile = useCallback((file: File | null) => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
    if (file && file.type.startsWith("image/")) {
      objectUrl.current = URL.createObjectURL(file);
    }
    setResult({
      cocoons: 42 + Math.floor(Math.random() * 37),
      confidence: 93 + Math.random() * 6,
      processingMs: 640 + Math.random() * 520,
      originalUrl: objectUrl.current,
    });
    setStage("loading");
  }, []);

  const finishLoading = useCallback(() => {
    setStage("result");
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, []);

  const reset = useCallback(() => {
    setStage("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="relative min-h-screen">
      <ForestBackground />
      <Navbar />

      <AnimatePresence>{stage === "loading" && <LoadingScreen onDone={finishLoading} />}</AnimatePresence>

      <main>
        {/* HERO */}
        <section id="home" className="mx-auto max-w-6xl px-5 pb-10 pt-32 sm:px-8 sm:pt-40">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <span className="pixel inline-block rounded-md border border-border bg-secondary/70 px-3 py-1.5 text-[9px] uppercase tracking-widest text-accent-foreground">
                <span className="text-accent">Pixel forest lab</span>
              </span>
              <h1 className="mt-5 text-2xl leading-relaxed text-foreground text-glow sm:text-4xl lg:text-5xl">
                Silk Cocoon <span className="text-accent">AI</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                AI Powered Cocoon Segmentation &amp; Analysis
              </p>
              <div className="mt-9 max-w-xl">
                <UploadArea onFile={handleFile} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              className="relative"
            >
              <CocoonBranch className="mx-auto w-full max-w-sm" />
              <p className="pixel mt-10 text-center text-[9px] leading-relaxed text-muted-foreground">
                Hover a cocoon — it sways. Watch the middle one long enough and it flies.
              </p>
            </motion.div>
          </div>
        </section>

        <LeafTransition />

        {/* RESULTS */}
        <div ref={resultRef}>
          <AnimatePresence>
            {stage === "result" && result && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="scroll-mt-28 px-5 py-10 sm:px-8"
                aria-label="Analysis results"
              >
                <h2 className="mb-7 text-center text-base text-foreground sm:text-xl">Analysis Complete</h2>
                <ResultView result={result} onReset={reset} />
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* FEATURES */}
        <Section id="features" eyebrow="Capabilities" title="Four quiet skills, working together.">
          <FeatureCards />
        </Section>

        <LeafTransition from="right" />
        <AboutSection />
        <LeafTransition />
        <TechnologySection />
        <LeafTransition from="right" />
        <DocumentationSection />
      </main>

      <Footer />
    </div>
  );
}
