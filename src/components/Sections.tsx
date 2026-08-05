import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {eyebrow && (
          <p className="pixel mb-3 text-[10px] uppercase tracking-widest text-accent">{eyebrow}</p>
        )}
        <h2 className="text-base leading-relaxed text-foreground sm:text-xl">{title}</h2>
        <div className="mt-7">{children}</div>
      </motion.div>
    </section>
  );
}

export function AboutSection() {
  const steps = [
    { n: "01", t: "Egg", d: "Silkworm eggs hatch in the rearing room under warm, steady light." },
    { n: "02", t: "Larva", d: "Caterpillars feed on mulberry leaves for roughly four weeks." },
    { n: "03", t: "Cocoon", d: "Each larva spins a single continuous silk thread around itself." },
    { n: "04", t: "Harvest", d: "Farmers grade and count cocoons — the step this tool automates." },
  ];

  return (
    <Section
      id="about"
      eyebrow="About"
      title="Counting cocoons by hand is slow, tiring and easy to get wrong."
    >
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Silk Cocoon AI looks at a single tray photo and separates every cocoon from its neighbours,
        returning a count, a confidence score and a clean overlay you can share with a co-op or a buyer.
        This build is a frontend demo — the numbers below come from placeholder data.
      </p>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.li
            key={s.n}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass rounded-2xl p-5"
          >
            <span className="pixel text-[10px] text-accent">{s.n}</span>
            <p className="pixel mt-3 text-[11px] text-foreground">{s.t}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </motion.li>
        ))}
      </ol>
    </Section>
  );
}

export function TechnologySection() {
  const rows = [
    ["Model", "Mask R-CNN style instance segmentation head"],
    ["Backbone", "ResNet-50 FPN, fine-tuned on farm imagery"],
    ["Input", "Single RGB tray photo, resized to 1024px"],
    ["Output", "Per-cocoon polygon masks, count, confidence"],
    ["Latency", "~0.8s per frame on a mid-range GPU"],
    ["Runtime", "Frontend demo — no backend in this build"],
  ];

  return (
    <Section id="technology" eyebrow="Technology" title="What lives under the leaves.">
      <div className="glass overflow-hidden rounded-2xl">
        <dl className="divide-y divide-border/60">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-4">
              <dt className="pixel text-[10px] text-accent">{k}</dt>
              <dd className="text-sm text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

export function DocumentationSection() {
  const docs = [
    {
      t: "Quick start",
      d: "Drop a tray photo on the upload area, wait for the caterpillar to finish crawling, read your results.",
    },
    {
      t: "Best photos",
      d: "Shoot straight down, fill the frame with the tray, avoid harsh shadows and motion blur.",
    },
    {
      t: "Reading the overlay",
      d: "Each colour is one detected instance. Overlapping cocoons keep separate masks.",
    },
    {
      t: "Exporting",
      d: "Download Result saves the segmented image. Counts and confidence are shown on the stat cards.",
    },
  ];

  return (
    <Section id="documentation" eyebrow="Documentation" title="Everything you need in four short notes.">
      <div className="grid gap-5 sm:grid-cols-2">
        {docs.map((d, i) => (
          <motion.article
            key={d.t}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="pixel text-[11px] text-foreground">{d.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.d}</p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}