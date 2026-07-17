"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Edit3,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileGlyph } from "@/components/onboarding/document-dropzone";
import { useStore } from "@/lib/store";
import { schemaFor, type DocumentField, type DocumentSchema } from "@/lib/document-schema";
import { cn, formatRelative } from "@/lib/utils";
import type { UploadedDocument } from "@/lib/types";

/**
 * Step 3 of the onboarding flow — Verify identity.
 *
 * Instead of a black-box AI "reading" the documents, we ask the reviewer
 * to capture the key fields from each uploaded document. Once every doc
 * has its data on file, Sentinel runs the compliance analysis silently
 * in the background so the AI Officer + Report views are populated when
 * the reviewer clicks through.
 */
export function AnalysisScreen({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { getClient, verifyDocument, runAnalysis } = useStore();
  const client = getClient(clientId);

  // Which document card is currently expanded. Initialised on mount to the
  // first unverified doc so reviewers land directly on the next thing to do.
  // Auto-advance from handleSave takes it from there.
  const [openId, setOpenId] = React.useState<string | null>(() => {
    const firstPending = client?.documents.find(
      (d) => d.status !== "verified",
    );
    return firstPending?.id ?? null;
  });

  if (!client) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Client not found.</p>
        <Button className="mt-4" asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const total = client.documents.length;
  const verifiedCount = client.documents.filter((d) => d.status === "verified").length;
  const pendingCount = total - verifiedCount;
  const allVerified = total > 0 && pendingCount === 0;

  function handleSave(doc: UploadedDocument, values: Record<string, string>) {
    verifyDocument(clientId, doc.id, values);
    toast.success(`${schemaFor(doc).displayName} verified`, {
      description: doc.name,
    });
    // Auto-advance to the next pending doc.
    const rest = client!.documents.filter(
      (d) => d.id !== doc.id && d.status !== "verified",
    );
    setOpenId(rest[0]?.id ?? null);
  }

  function handleFinish() {
    // Silently compute the compliance analysis so the Officer + Report
    // views have data when we route there.
    runAnalysis(clientId);
    router.push(`/clients/${clientId}/officer`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/clients", label: "Clients" },
          { href: `/clients/${clientId}`, label: client.name },
          { label: "Verify identity" },
        ]}
        eyebrow="Onboarding · Step 3 of 4"
        title="Verify identity"
        description="For each document you uploaded, capture the key fields. Sentinel cross-checks them against the client profile and flags any inconsistencies."
        actions={
          <Button variant="outline" size="md" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="mt-6">
        <StepIndicator current={3} />
      </div>

      {total === 0 ? (
        <EmptyDocsPanel clientId={clientId} />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Documents list */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[13px] text-[var(--foreground-muted)]">
                <strong className="tabular text-[var(--foreground)]">
                  {verifiedCount}
                </strong>{" "}
                of{" "}
                <strong className="tabular text-[var(--foreground)]">
                  {total}
                </strong>{" "}
                documents verified
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-muted)]/60 px-2 py-0.5 text-[10.5px] font-mono uppercase tracking-wider text-[var(--foreground-subtle)]">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    allVerified
                      ? "bg-[var(--success)]"
                      : "bg-[var(--warning)] animate-[pulseSlow_2s_infinite]",
                  )}
                />
                {allVerified ? "ready" : "in progress"}
              </span>
            </div>

            {client.documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <DocumentCard
                  doc={doc}
                  open={openId === doc.id}
                  onToggle={() =>
                    setOpenId(openId === doc.id ? null : doc.id)
                  }
                  onSave={(values) => handleSave(doc, values)}
                />
              </motion.div>
            ))}

            {allVerified ? (
              <VerifiedHero
                client={client}
                verifiedCount={verifiedCount}
                onContinue={handleFinish}
              />
            ) : null}
          </div>

          <ProgressSidebar
            client={client}
            verifiedCount={verifiedCount}
            total={total}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- Document card ---------------- */

function DocumentCard({
  doc,
  open,
  onToggle,
  onSave,
}: {
  doc: UploadedDocument;
  open: boolean;
  onToggle: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const schema = schemaFor(doc);
  const isVerified = doc.status === "verified";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        isVerified && "border-[color-mix(in_srgb,var(--success)_30%,var(--border))]",
      )}
    >
      {/* Header (always visible) */}
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-4 p-5 text-left"
      >
        <FileGlyph name={doc.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[14px] font-semibold tracking-tight">
              {schema.displayName}
            </p>
            <Badge variant="outline" size="sm">
              {schema.section}
            </Badge>
            {isVerified ? (
              <Badge variant="success" size="sm">
                <BadgeCheck className="h-3 w-3" strokeWidth={2.4} />
                Verified
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <Clock className="h-3 w-3" strokeWidth={2.4} />
                Awaiting details
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-[12.5px] text-[var(--foreground-muted)]">
            {doc.name}
            {isVerified && doc.verifiedData ? (
              <>
                <span className="mx-1.5 text-[var(--foreground-subtle)]">·</span>
                <span className="text-[var(--foreground)]">
                  {schema.summary(doc.verifiedData)}
                </span>
              </>
            ) : (
              <>
                <span className="mx-1.5 text-[var(--foreground-subtle)]">·</span>
                <span>{schema.purpose}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11.5px] text-[var(--foreground-subtle)]">
              <Pencil className="h-3 w-3" />
              Edit
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[var(--foreground-subtle)] transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Expandable form / summary */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[var(--border)]"
          >
            <DocumentForm
              schema={schema}
              initialValues={doc.verifiedData ?? {}}
              onCancel={onToggle}
              onSave={onSave}
              submitLabel={isVerified ? "Update details" : "Save & verify"}
            />
          </motion.div>
        ) : isVerified && doc.verifiedData ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-[var(--border)] px-5 py-4 bg-[var(--surface-muted)]/30"
          >
            <VerifiedSummary schema={schema} data={doc.verifiedData} />
            {doc.verifiedAt ? (
              <p className="mt-3 text-[11px] font-mono text-[var(--foreground-subtle)]">
                Verified {formatRelative(doc.verifiedAt)}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

/* ---------------- Form ---------------- */

function DocumentForm({
  schema,
  initialValues,
  onCancel,
  onSave,
  submitLabel,
}: {
  schema: DocumentSchema;
  initialValues: Record<string, string>;
  onCancel: () => void;
  onSave: (values: Record<string, string>) => void;
  submitLabel: string;
}) {
  const defaultValues = React.useMemo(() => {
    const d: Record<string, string> = {};
    for (const field of schema.fields) {
      d[field.key] = initialValues[field.key] ?? "";
    }
    return d;
  }, [schema, initialValues]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    defaultValues,
    mode: "onBlur",
  });

  const onSubmit = (values: Record<string, string>) => {
    // Trim string values; drop empties from stored record.
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      const trimmed = String(v ?? "").trim();
      if (trimmed) cleaned[k] = trimmed;
    }
    onSave(cleaned);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-5 md:p-6">
      <p className="mb-4 flex items-center gap-2 text-[12.5px] text-[var(--foreground-muted)]">
        <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
        Sentinel highlights each field with the exact section of the document to check.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {schema.fields.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            register={register}
            control={control}
            error={errors[field.key]?.message as string | undefined}
            fullWidth={field.type === "textarea"}
          />
        ))}
      </div>
      <div className="mt-5 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Check className="h-4 w-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FieldRow({
  field,
  register,
  control,
  error,
  fullWidth,
}: {
  field: DocumentField;
  register: ReturnType<typeof useForm<Record<string, string>>>["register"];
  control: ReturnType<typeof useForm<Record<string, string>>>["control"];
  error?: string;
  fullWidth?: boolean;
}) {
  const rules = field.required ? { required: `${field.label} is required` } : {};

  return (
    <div className={cn("grid gap-1.5", fullWidth && "md:col-span-2")}>
      <Label className="flex items-center gap-1.5 text-[12.5px]">
        {field.label}
        {field.required ? (
          <span className="text-[var(--danger)]" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {field.type === "select" ? (
        <Controller
          control={control}
          name={field.key}
          rules={rules}
          render={({ field: rhf }) => (
            <Select value={rhf.value} onValueChange={rhf.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder ?? "Select…"} />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      ) : field.type === "textarea" ? (
        <Textarea
          rows={3}
          placeholder={field.placeholder}
          {...register(field.key, rules)}
        />
      ) : (
        <Input
          type={field.type === "number" || field.type === "date" ? field.type : "text"}
          inputMode={field.inputMode}
          placeholder={field.placeholder}
          className={cn(
            field.type === "number" && "tabular font-medium",
            field.type === "date" && "tabular",
          )}
          {...register(field.key, rules)}
        />
      )}
      {error ? (
        <p className="text-[11.5px] text-[var(--danger)]">{error}</p>
      ) : field.hint ? (
        <p className="text-[11px] text-[var(--foreground-subtle)]">{field.hint}</p>
      ) : null}
    </div>
  );
}

function VerifiedSummary({
  schema,
  data,
}: {
  schema: DocumentSchema;
  data: Record<string, string>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3">
      {schema.fields.map((f) => {
        const v = data[f.key];
        if (!v) return null;
        return (
          <div key={f.key} className="min-w-0">
            <dt className="text-[10.5px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
              {f.label}
            </dt>
            <dd
              className={cn(
                "mt-0.5 truncate text-[13px] font-medium text-[var(--foreground)]",
                (f.type === "number" || f.type === "date") && "tabular",
              )}
              title={v}
            >
              {v}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/* ---------------- Success hero ---------------- */

function VerifiedHero({
  client,
  verifiedCount,
  onContinue,
}: {
  client: NonNullable<ReturnType<typeof useStore>["state"]["clients"][number]>;
  verifiedCount: number;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="gradient-ring relative mt-3 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--success) 20%, transparent), transparent 60%), radial-gradient(ellipse at 90% 100%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 60%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 dot-bg radial-fade opacity-30" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--success)] text-white shadow-[0_10px_28px_-8px_var(--success)]">
            <BadgeCheck className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                Identity confirmed
              </span>
              <span className="tabular">
                {verifiedCount} / {verifiedCount} documents matched
              </span>
            </div>
            <h3 className="mt-3 font-display text-[32px] md:text-[38px] font-medium leading-[1.05] tracking-tight text-balance">
              Customer verified.
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--foreground-muted)] text-pretty">
              All identity fields for{" "}
              <strong className="text-[var(--foreground)]">{client.name}</strong>{" "}
              are on file. Sentinel is drafting the compliance recommendation now.
            </p>
          </div>
        </div>
        <Button size="lg" onClick={onContinue}>
          Open AI Compliance Officer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ---------------- Sidebar ---------------- */

function ProgressSidebar({
  client,
  verifiedCount,
  total,
}: {
  client: NonNullable<ReturnType<typeof useStore>["state"]["clients"][number]>;
  verifiedCount: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((verifiedCount / total) * 100);
  const size = 128;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = r * 2 * Math.PI;

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
              >
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke="var(--border)"
                  strokeWidth={stroke}
                  fill="none"
                />
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke="var(--success)"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={c}
                  initial={{ strokeDashoffset: c }}
                  animate={{ strokeDashoffset: c - (pct / 100) * c }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[28px] font-medium leading-none tabular">
                  {pct}%
                </span>
                <span className="mt-0.5 text-[10.5px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
                  verified
                </span>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-[var(--foreground-muted)] text-center">
              {verifiedCount === total ? (
                <>All fields captured. You&apos;re ready to move on.</>
              ) : (
                <>
                  {total - verifiedCount} document
                  {total - verifiedCount === 1 ? "" : "s"} still need details.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
            What Sentinel does with this
          </div>
          <ul className="mt-3 flex flex-col gap-2.5 text-[12.5px] text-[var(--foreground-muted)] leading-relaxed">
            {[
              "Cross-checks each field against the client profile you entered",
              "Verifies expiry dates and identity coverage (100 points)",
              "Screens named individuals against sanctions and PEP lists",
              "Files every field into the audit-ready compliance report",
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--primary)]" />
                {line}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-4">
        <p className="text-[10.5px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
          Client
        </p>
        <p className="mt-1 text-[14px] font-medium tracking-tight">
          {client.name}
        </p>
        <p className="text-[11.5px] text-[var(--foreground-muted)]">
          {client.entityType} · {client.reference}
        </p>
      </div>
    </aside>
  );
}

/* ---------------- Empty state ---------------- */

function EmptyDocsPanel({ clientId }: { clientId: string }) {
  return (
    <Card className="mt-8">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[color-mix(in_srgb,var(--warning)_80%,var(--foreground))]">
          <Edit3 className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-lg font-semibold">No documents to verify yet.</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)] max-w-md">
            Upload identity, address and any structure documents first — you&apos;ll
            capture the fields here.
          </p>
        </div>
        <Button asChild>
          <Link href={`/clients/${clientId}/upload`}>
            Go to upload
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
