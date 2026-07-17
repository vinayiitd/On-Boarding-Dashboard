"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  FileImage,
  FileType,
  UploadCloud,
  X,
  CheckCircle2,
  File as FileIcon,
} from "lucide-react";
import { cn, sleep } from "@/lib/utils";

export interface DocumentDropzoneProps {
  onFilesAdded: (files: File[]) => Promise<void> | void;
  accept?: string;
  className?: string;
}

interface StagedFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "complete";
}

/**
 * Drag & drop uploader with animated progress bars.
 * The upload itself is simulated — files are streamed to the store on completion.
 */
export function DocumentDropzone({
  onFilesAdded,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.heic",
  className,
}: DocumentDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [staged, setStaged] = React.useState<StagedFile[]>([]);
  const dragCounter = React.useRef(0);

  const handleFiles = React.useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const items: StagedFile[] = files.map((f) => ({
        id: `${f.name}-${f.size}-${crypto.randomUUID().slice(0, 6)}`,
        file: f,
        progress: 0,
        status: "uploading",
      }));
      setStaged((prev) => [...items, ...prev]);

      // Simulated upload progress per file.
      await Promise.all(
        items.map(async (item) => {
          const totalTicks = 20;
          for (let i = 1; i <= totalTicks; i++) {
            await sleep(60 + Math.random() * 60);
            setStaged((prev) =>
              prev.map((s) =>
                s.id === item.id ? { ...s, progress: (i / totalTicks) * 100 } : s,
              ),
            );
          }
          setStaged((prev) =>
            prev.map((s) =>
              s.id === item.id ? { ...s, progress: 100, status: "complete" } : s,
            ),
          );
        }),
      );

      await onFilesAdded(items.map((i) => i.file));

      // Clear the "just uploaded" tray after a beat so the persisted list can take over.
      await sleep(1200);
      setStaged((prev) => prev.filter((s) => !items.find((it) => it.id === s.id)));
    },
    [onFilesAdded],
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    handleFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    handleFiles(files);
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current += 1;
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current -= 1;
          if (dragCounter.current <= 0) setIsDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed",
          "px-6 py-14 text-center transition-all cursor-pointer overflow-hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          isDragging
            ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_6%,var(--surface))]"
            : "border-[var(--border-strong)] bg-[var(--surface)] hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border-strong))] hover:bg-[color-mix(in_srgb,var(--primary)_3%,var(--surface))]",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 opacity-40 grid-bg radial-fade transition-opacity",
            isDragging ? "opacity-100" : "opacity-30",
          )}
        />
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={onInputChange}
        />
        <motion.div
          animate={{
            y: isDragging ? -4 : 0,
            scale: isDragging ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] text-[var(--primary)]"
        >
          <UploadCloud className="h-6 w-6" />
        </motion.div>
        <div className="relative">
          <p className="text-[15px] font-medium">
            {isDragging ? "Drop to upload" : "Drag & drop documents here"}
          </p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            or{" "}
            <span className="text-[var(--primary)] underline underline-offset-4">
              browse from your computer
            </span>
          </p>
          <p className="mt-3 text-xs text-[var(--foreground-subtle)]">
            PDF, JPG, PNG · up to 25MB each · multiple files supported
          </p>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {staged.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-2"
          >
            {staged.map((s) => (
              <StagedRow key={s.id} item={s} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function StagedRow({ item }: { item: StagedFile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5"
    >
      <FileGlyph name={item.file.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{item.file.name}</p>
          <span className="text-xs text-[var(--foreground-subtle)] tabular-nums">
            {Math.round(item.progress)}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <motion.div
            className="h-full rounded-full bg-[var(--primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
        </div>
      </div>
      {item.status === "complete" ? (
        <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
      ) : null}
    </motion.div>
  );
}

export function FileGlyph({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const Icon =
    ext === "pdf"
      ? FileText
      : ["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext)
        ? FileImage
        : ["doc", "docx"].includes(ext)
          ? FileType
          : FileIcon;

  const tone =
    ext === "pdf"
      ? "bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[color-mix(in_srgb,var(--danger)_80%,var(--foreground))]"
      : ["jpg", "jpeg", "png", "webp", "heic"].includes(ext)
        ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color-mix(in_srgb,var(--accent)_80%,var(--foreground))]"
        : "bg-[var(--surface-muted)] text-[var(--foreground-muted)]";

  const dims = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-lg", dims, tone)}>
      <Icon className={icon} />
    </div>
  );
}

export { X };
