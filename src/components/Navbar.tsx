import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { useTheme } from "@/hooks/useTheme";
import { PixelCocoon, PixelGithub, PixelMoon, PixelSun } from "./pixel/PixelIcons";

const links = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Technology", href: "#technology" },
  { label: "Documentation", href: "#documentation" },
];

export function Navbar() {
  const { theme, toggle, mounted } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-xl px-3 py-2 transition-all duration-500 sm:px-5 sm:py-3 ${
          scrolled ? "glass" : "border border-transparent"
        }`}
      >
        <a href="#home" className="flex items-center gap-2 sm:gap-3">
          <motion.span
            whileHover={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 0.7 }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/70"
          >
            <PixelCocoon className="h-7 w-7" />
          </motion.span>
          <span className="pixel text-[11px] leading-tight text-foreground sm:text-sm">
            Silk Cocoon <span className="text-accent">AI</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative block rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to cream daylight theme" : "Switch to dark forest theme"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary/60 transition-transform hover:-translate-y-0.5"
          >
            {mounted && theme === "dark" ? <PixelSun className="h-5 w-5" /> : <PixelMoon className="h-5 w-5" />}
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub repository"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary/60 text-foreground transition-transform hover:-translate-y-0.5"
          >
            <PixelGithub className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="pixel inline-flex h-9 items-center rounded-md border border-border bg-secondary/60 px-2 text-[10px] md:hidden"
          >
            {open ? "X" : "MENU"}
          </button>
        </div>
      </motion.nav>

      {open && (
        <motion.ul
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mx-auto mt-2 max-w-6xl overflow-hidden rounded-xl md:hidden"
        >
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-sm font-semibold text-foreground/90 hover:bg-secondary/60"
              >
                {l.label}
              </a>
            </li>
          ))}
        </motion.ul>
      )}
    </header>
  );
}