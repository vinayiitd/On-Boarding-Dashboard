"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileText,
  IdCard,
  Landmark,
  Plus,
  Receipt,
  ScrollText,
  Shield,
  Trash2,
  Upload,
  UserRoundSearch,
  Users,
  Wallet,
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
import {
  PRIMARY_TYPES,
  SCHEMAS,
  SECONDARY_TYPES,
  TYPE_TO_CATEGORY,
  inferType,
  type DocumentField,
  type DocumentSchema,
  type DocumentType,
} from "@/lib/document-schema";
import { cn } from "@/lib/utils";
import type { UploadedDocument } from "@/lib/types";

/**
 * Step 2 of onboarding — Documents & identity.
 *
 * Combines type picking, file upload, and field capture into a single
 * screen. The reviewer picks the document types they have (Driver's
 * Licence, Passport, Medicare card, Utility bill, plus more), each
 * choice spawns a card with an inline file input and the fields for
 * that type, all cards auto-save as the reviewer types, and a single
 * "Confirm customer" button at the bottom finalises the customer and
 * routes to the AI Compliance Officer view.
 */
export function UploadScreen({ clientId }: { clientId: string }) {
  const router = useRouter();
  const {
    getClient,
    addTypedDocument,
    attachFile,
    removeDocument,
    verifyDocument,
    runAnalysis,
  } = useStore();
  const client = getClient(clientId);

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

  const docs = client.documents;
  const requiredComplete = (d: UploadedDocument) => {
    const schema = SCHEMAS[docTypeOf(d)];
    const requiredKeys = schema.fields.filter((f) => f.required).map((f) => f.key);
    return requiredKeys.every((k) => (d.verifiedData?.[k] ?? "").trim().length > 0);
  };
  const readyDocs = docs.filter(requiredComplete);
  const canConfirm = docs.length > 0 && readyDocs.length === docs.length;

  function addType(type: DocumentType) {
    const schema = SCHEMAS[type];
    addTypedDocument(clientId, {
      name: `${schema.displayName} (pending)`,
      sizeKb: 0,
      type,
      category: TYPE_TO_CATEGORY[type],
    });
  }

  function updateFields(doc: UploadedDocument, values: Record<string, string>) {
    // Preserve the __type tag alongside the captured fields.
    verifyDocument(clientId, doc.id, {
      __type: docTypeOf(doc),
      ...values,
    });
  }

  function handleConfirm() {
    // Snapshot analysis so the Officer + Report views have data.
    runAnalysis(clientId);
    toast.success("Customer confirmed", {
      description: `${docs.length} document${docs.length === 1 ? "" : "s"} captured for ${client!.name}.`,
    });
    router.push(`/clients/${clientId}/officer`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/clients", label: "Clients" },
          { href: `/clients/${clientId}`, label: client.name },
          { label: "Documents & identity" },
        ]}
        eyebrow="Onboarding · Step 2 of 3"
        title="Documents & identity"
        description="Pick every document you have for this client, upload the file, and enter the key details. Sentinel cross-checks them and drafts the compliance recommendation when you confirm."
        actions={
          <Button variant="outline" size="md" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="mt-6">
        <StepIndicator current={2} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          <TypePicker
            existingTypes={new Set(docs.map(docTypeOf))}
            onPick={addType}
          />

          {docs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="px-1 text-[13px] text-[var(--foreground-muted)]">
                <strong className="tabular text-[var(--foreground)]">
                  {readyDocs.length}
                </strong>{" "}
                of{" "}
                <strong className="tabular text-[var(--foreground)]">
                  {docs.length}
                </strong>{" "}
                documents ready
              </p>

              <AnimatePresence initial={false}>
                {docs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ delay: i * 0.03, duration: 0.35 }}
                  >
                    <DocumentCard
                      doc={doc}
                      onChange={(values) => updateFields(doc, values)}
                      onAttachFile={(name, sizeKb) =>
                        attachFile(clientId, doc.id, { name, sizeKb })
                      }
                      onRemove={() => removeDocument(clientId, doc.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Bottom confirm bar */}
          {docs.length > 0 ? (
            <ConfirmBar
              client={client}
              ready={readyDocs.length}
              total={docs.length}
              canConfirm={canConfirm}
              onConfirm={handleConfirm}
            />
          ) : null}
        </div>

        {/* Sidebar */}
        <ContextSidebar client={client} readyCount={readyDocs.length} total={docs.length} />
      </div>
    </div>
  );
}

/* ---------------- Type picker ---------------- */

const TYPE_ICON: Record<DocumentType, React.ElementType> = {
  drivers_licence: IdCard,
  passport: FileText,
  medicare_card: CreditCard,
  utility_bill: Receipt,
  asic_extract: Building2,
  trust_deed: Landmark,
  beneficial_owner: Users,
  source_of_funds: Wallet,
  generic: ScrollText,
};

function TypePicker({
  existingTypes,
  onPick,
}: {
  existingTypes: Set<DocumentType>;
  onPick: (t: DocumentType) => void;
}) {
  const [showMore, setShowMore] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-3 md:p-6 md:pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
            <UserRoundSearch className="h-3.5 w-3.5" strokeWidth={2.4} />
          </div>
          <p className="text-[14px] font-semibold tracking-tight">
            Which documents do you have?
          </p>
        </div>
        <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">
          Pick every document you can collect from this client. You can add
          more or remove any later.
        </p>
      </div>

      <div className="px-5 pb-4 md:px-6">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {PRIMARY_TYPES.map((t) => (
            <TypeTile
              key={t}
              type={t}
              added={existingTypes.has(t)}
              onPick={onPick}
            />
          ))}
        </div>

        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                showMore && "rotate-180",
              )}
            />
            {showMore ? "Hide" : "More document types"}
          </button>
          <AnimatePresence initial={false}>
            {showMore ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3">
                  {SECONDARY_TYPES.map((t) => (
                    <TypeTile
                      key={t}
                      type={t}
                      added={existingTypes.has(t)}
                      onPick={onPick}
                      compact
                    />
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

function TypeTile({
  type,
  added,
  onPick,
  compact,
}: {
  type: DocumentType;
  added: boolean;
  onPick: (t: DocumentType) => void;
  compact?: boolean;
}) {
  const schema = SCHEMAS[type];
  const Icon = TYPE_ICON[type] ?? ScrollText;
  return (
    <button
      type="button"
      onClick={() => onPick(type)}
      className={cn(
        "group relative flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all overflow-hidden",
        "hover:-translate-y-0.5",
        added
          ? "border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface))]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-card)]",
      )}
      title={added ? "Add another of this type" : `Add ${schema.displayName}`}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg transition-colors",
          compact ? "h-7 w-7" : "h-8 w-8",
          added
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--surface-muted)] text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]",
        )}
      >
        <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium tracking-tight", compact ? "text-[12.5px]" : "text-[13px]")}>
          {schema.displayName}
        </p>
        <p className={cn("truncate text-[var(--foreground-muted)]", compact ? "text-[10.5px]" : "text-[11px]")}>
          {added ? "Added — click to add another" : schema.purpose}
        </p>
      </div>
      {added ? (
        <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
      ) : (
        <Plus className="absolute right-2.5 top-2.5 h-3 w-3 text-[var(--foreground-subtle)]" />
      )}
    </button>
  );
}

/* ---------------- Document card ---------------- */

function DocumentCard({
  doc,
  onChange,
  onAttachFile,
  onRemove,
}: {
  doc: UploadedDocument;
  onChange: (values: Record<string, string>) => void;
  onAttachFile: (name: string, sizeKb: number) => void;
  onRemove: () => void;
}) {
  const type = docTypeOf(doc);
  const schema = SCHEMAS[type];
  const Icon = TYPE_ICON[type] ?? ScrollText;

  const hasFile = doc.sizeKb > 0;
  const requiredKeys = schema.fields.filter((f) => f.required).map((f) => f.key);
  const requiredComplete = requiredKeys.every(
    (k) => (doc.verifiedData?.[k] ?? "").trim().length > 0,
  );
  const isReady = requiredComplete;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        isReady
          ? "border-[color-mix(in_srgb,var(--success)_30%,var(--border))]"
          : "border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold tracking-tight">
              {schema.displayName}
            </p>
            <Badge variant="outline" size="sm">
              {schema.section}
            </Badge>
            {isReady ? (
              <Badge variant="success" size="sm">
                <BadgeCheck className="h-3 w-3" strokeWidth={2.4} />
                Ready
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <Clock className="h-3 w-3" strokeWidth={2.4} />
                {hasFile ? "Fill details" : "Add file & details"}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-[var(--foreground-muted)]">
            {schema.purpose}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          onClick={onRemove}
          aria-label="Remove document"
        >
          <Trash2 className="h-4 w-4 text-[var(--foreground-subtle)]" />
        </Button>
      </div>

      {/* File input + form */}
      <div className="grid gap-5 p-5 md:p-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <FilePicker doc={doc} onAttach={onAttachFile} />
        <DocumentFieldForm doc={doc} schema={schema} onChange={onChange} />
      </div>
    </Card>
  );
}

function FilePicker({
  doc,
  onAttach,
}: {
  doc: UploadedDocument;
  onAttach: (name: string, sizeKb: number) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasFile = doc.sizeKb > 0;

  function onFile(f: File | null) {
    if (!f) return;
    onAttach(f.name, Math.max(80, Math.round(f.size / 1024)));
  }

  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed",
        "p-4 text-center transition-colors",
        hasFile
          ? "border-[color-mix(in_srgb,var(--success)_30%,var(--border-strong))] bg-[color-mix(in_srgb,var(--success)_5%,var(--surface))]"
          : "border-[var(--border-strong)] bg-[var(--surface-muted)]/30 hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border-strong))] hover:bg-[color-mix(in_srgb,var(--primary)_3%,var(--surface))]",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {hasFile ? (
        <>
          <FileGlyph name={doc.name} />
          <p className="w-full truncate text-[12.5px] font-medium" title={doc.name}>
            {doc.name}
          </p>
          <p className="text-[10.5px] font-mono text-[var(--foreground-subtle)] tabular">
            {(doc.sizeKb / 1024).toFixed(1)} MB
          </p>
          <span className="text-[11px] text-[var(--primary)] font-medium underline underline-offset-4 decoration-[var(--primary)]/30">
            Replace file
          </span>
        </>
      ) : (
        <>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--primary)] shadow-[var(--shadow-soft)]">
            <Upload className="h-4 w-4" strokeWidth={2} />
          </div>
          <p className="text-[12.5px] font-medium">Upload the scan</p>
          <p className="text-[11px] text-[var(--foreground-subtle)]">
            PDF, JPG or PNG · max 25 MB
          </p>
        </>
      )}
    </label>
  );
}

function DocumentFieldForm({
  doc,
  schema,
  onChange,
}: {
  doc: UploadedDocument;
  schema: DocumentSchema;
  onChange: (values: Record<string, string>) => void;
}) {
  const defaultValues = React.useMemo(() => {
    const d: Record<string, string> = {};
    for (const f of schema.fields) {
      d[f.key] = doc.verifiedData?.[f.key] ?? "";
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  const { register, control, getValues } = useForm<Record<string, string>>({
    defaultValues,
    mode: "onChange",
  });

  // Debounced auto-save on any change.
  const pushChanges = React.useCallback(() => {
    onChange(getValues());
  }, [getValues, onChange]);

  return (
    <form
      onChange={pushChanges}
      onBlur={pushChanges}
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-3 md:grid-cols-2"
    >
      {schema.fields.map((f) => (
        <FieldRow
          key={f.key}
          field={f}
          register={register}
          control={control}
          onControlledChange={pushChanges}
          fullWidth={f.type === "textarea"}
        />
      ))}
    </form>
  );
}

function FieldRow({
  field,
  register,
  control,
  onControlledChange,
  fullWidth,
}: {
  field: DocumentField;
  register: ReturnType<typeof useForm<Record<string, string>>>["register"];
  control: ReturnType<typeof useForm<Record<string, string>>>["control"];
  onControlledChange: () => void;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("grid gap-1.5", fullWidth && "md:col-span-2")}>
      <Label className="flex items-center gap-1.5 text-[12px]">
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
          render={({ field: rhf }) => (
            <Select
              value={rhf.value}
              onValueChange={(v) => {
                rhf.onChange(v);
                onControlledChange();
              }}
            >
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
          rows={2}
          placeholder={field.placeholder}
          {...register(field.key)}
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
          {...register(field.key)}
        />
      )}
      {field.hint ? (
        <p className="text-[10.5px] text-[var(--foreground-subtle)]">
          {field.hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------- Bottom confirm bar ---------------- */

function ConfirmBar({
  client,
  ready,
  total,
  canConfirm,
  onConfirm,
}: {
  client: NonNullable<ReturnType<typeof useStore>["state"]["clients"][number]>;
  ready: number;
  total: number;
  canConfirm: boolean;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      layout
      className={cn(
        "gradient-ring relative overflow-hidden rounded-2xl border border-[var(--border)] p-5 md:p-6",
        canConfirm
          ? "bg-[color-mix(in_srgb,var(--success)_5%,var(--surface))]"
          : "bg-[color-mix(in_srgb,var(--primary)_3%,var(--surface))]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dot-bg radial-fade opacity-30"
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_10px_24px_-8px]",
              canConfirm
                ? "bg-[var(--success)] shadow-[var(--success)]"
                : "bg-[var(--primary)] shadow-[var(--primary)]",
            )}
          >
            {canConfirm ? (
              <BadgeCheck className="h-5 w-5" strokeWidth={2.2} />
            ) : (
              <Shield className="h-5 w-5" strokeWidth={2.2} />
            )}
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight">
              {canConfirm ? "Ready to confirm" : "Almost there"}
            </p>
            <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">
              {canConfirm ? (
                <>
                  Every document for{" "}
                  <strong className="text-[var(--foreground)]">
                    {client.name}
                  </strong>{" "}
                  has a file and its required fields. Confirm to draft the
                  compliance recommendation.
                </>
              ) : (
                <>
                  <strong className="tabular text-[var(--foreground)]">
                    {ready}
                  </strong>{" "}
                  of{" "}
                  <strong className="tabular text-[var(--foreground)]">
                    {total}
                  </strong>{" "}
                  documents complete. Finish the remaining fields to enable
                  Confirm.
                </>
              )}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          disabled={!canConfirm}
          onClick={onConfirm}
          className="shrink-0"
        >
          <ClipboardCheck className="h-4 w-4" />
          Confirm customer
        </Button>
      </div>
    </motion.div>
  );
}

/* ---------------- Sidebar ---------------- */

function ContextSidebar({
  client,
  readyCount,
  total,
}: {
  client: NonNullable<ReturnType<typeof useStore>["state"]["clients"][number]>;
  readyCount: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((readyCount / total) * 100);
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
                  animate={{ strokeDashoffset: c - (pct / 100) * c }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[28px] font-medium leading-none tabular">
                  {pct}%
                </span>
                <span className="mt-0.5 text-[10.5px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
                  ready
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-[13px] text-[var(--foreground-muted)]">
              {total === 0 ? (
                <>Pick a document type to begin.</>
              ) : readyCount === total ? (
                <>You&apos;re ready to confirm the customer.</>
              ) : (
                <>
                  <strong className="tabular text-[var(--foreground)]">
                    {total - readyCount}
                  </strong>{" "}
                  document{total - readyCount === 1 ? "" : "s"} still need
                  details.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <Shield className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
            What Sentinel does next
          </div>
          <ul className="mt-3 flex flex-col gap-2.5 text-[12.5px] text-[var(--foreground-muted)] leading-relaxed">
            {[
              "Cross-checks every field against the client profile",
              "Verifies expiry dates and 100-point identity coverage",
              "Screens named individuals against sanctions & PEP lists",
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

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]">
        <IdCard className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="mt-3 text-[14px] font-semibold tracking-tight">
        No documents added yet
      </p>
      <p className="mt-1 text-[13px] text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed">
        Choose a document type above — a card will appear here for you to
        upload the file and enter the details.
      </p>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function docTypeOf(doc: UploadedDocument): DocumentType {
  return (
    (doc.verifiedData?.__type as DocumentType | undefined) ??
    inferType(doc.name, doc.category)
  );
}
