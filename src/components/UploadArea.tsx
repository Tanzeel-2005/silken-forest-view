import { motion } from "motion/react";
import { useRef, useState } from "react";

import { PixelLeaf, PixelUpload } from "./pixel/PixelIcons";

export function UploadArea({ onFile }: { onFile: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = () => inputRef.current?.click();

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      <motion.div
        whileHover={{ y: -3 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files?.[0] ?? null);
        }}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop a cocoon image, or press Enter to browse files"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick();
          }
        }}
        onClick={pick}
        className={`glass group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-7 text-center transition-colors sm:p-10 ${
          dragging ? "border-accent bg-accent/10" : "border-primary/40"
        }`}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-4 h-14 w-14"
        >
          <PixelUpload className="h-full w-full" />
        </motion.div>
        <p className="pixel text-[11px] text-foreground sm:text-xs">Drop a cocoon photo here</p>
        <p className="mt-3 text-sm text-muted-foreground">
          JPG or PNG up to 10 MB — or click to browse your farm gallery
        </p>

        <motion.div
          className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 opacity-0 transition-opacity group-hover:opacity-80"
          animate={{ rotate: [0, 20, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <PixelLeaf className="h-full w-full" />
        </motion.div>
      </motion.div>

      <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row">
        <motion.button
          type="button"
          onClick={pick}
          whileHover={{ y: -2 }}
          whileTap={{ y: 1 }}
          className="pixel inline-flex w-full items-center justify-center gap-3 rounded-lg border-2 border-forest bg-primary px-6 py-4 text-[11px] text-primary-foreground shadow-[4px_4px_0_0_var(--bark)] transition-shadow hover:shadow-[6px_6px_0_0_var(--bark)] sm:w-auto sm:text-xs"
        >
          <PixelUpload className="h-5 w-5" />
          Upload Image
        </motion.button>
        <p className="text-xs text-muted-foreground">
          Demo mode — analysis runs on bundled placeholder data.
        </p>
      </div>
    </div>
  );
}