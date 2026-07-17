"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ClipboardCheck, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentDropzone, FileGlyph } from "@/components/onboarding/document-dropzone";
import { useStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";
import type { DocumentCategory } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const suggestedDocuments: {
  category: DocumentCategory;
  name: string;
  note: string;
}[] = [
  { category: "Identity", name: "Passport.pdf", note: "Primary identity" },
  { category: "Identity", name: "DriversLicence.jpg", note: "Secondary identity" },
  { category: "Address", name: "UtilityBill.pdf", note: "< 3 months old" },
  { category: "Business", name: "ASICExtract.pdf", note: "Companies only" },
  { category: "Trust", name: "TrustDeed.pdf", note: "Trust structures" },
  {
    category: "Ownership",
    name: "BeneficialOwnerDeclaration.pdf",
    note: "≥ 25% owners",
  },
  { category: "Financial", name: "SourceOfFunds.pdf", note: "For large TXN" },
];

export function UploadScreen({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { getClient, addDocuments, removeDocument } = useStore();
  const client = getClient(clientId);

  if (!client) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-8 text-center">
        <p className="text-lg font-semibold">Client not found.</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          The client may have been removed. Return to your dashboard.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const docsByCategory = client.documents.reduce<
    Record<string, typeof client.documents>
  >((acc, d) => {
    acc[d.category] = acc[d.category] ? [...acc[d.category], d] : [d];
    return acc;
  }, {});

  async function handleUpload(files: File[]) {
    const added = addDocuments(clientId, files);
    toast.success(
      `${added.length} document${added.length === 1 ? "" : "s"} added`,
      {
        description: added.map((d) => d.name).slice(0, 3).join(", "),
      },
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/clients", label: "Clients" },
          { href: `/clients/${clientId}`, label: client.name },
          { label: "Upload" },
        ]}
        eyebrow="Onboarding · Step 2 of 4"
        title="Upload documents"
        description="Add every document you have for this client. Sentinel classifies each file automatically — you'll capture the details on the next step."
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
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Drop files</CardTitle>
              <p className="text-sm text-[var(--foreground-muted)]">
                We accept PDFs and images. Multiple files at once is fine.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <DocumentDropzone onFilesAdded={handleUpload} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Uploaded documents</CardTitle>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {client.documents.length} file
                  {client.documents.length === 1 ? "" : "s"} · classified by Sentinel
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {client.documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border-strong)] px-6 py-10 text-center">
                  <p className="text-sm font-medium">No documents yet.</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Drop files above to get started.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <AnimatePresence initial={false}>
                    {Object.entries(docsByCategory).map(([category, docs]) => (
                      <motion.section
                        key={category}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm">
                            {category}
                          </Badge>
                          <span className="text-xs text-[var(--foreground-subtle)]">
                            {docs.length} file{docs.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {docs.map((d) => (
                            <motion.div
                              key={d.id}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="group relative flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 transition-all hover:shadow-[var(--shadow-card)]"
                            >
                              <FileGlyph name={d.name} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {d.name}
                                </p>
                                <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
                                  {(d.sizeKb / 1024).toFixed(1)} MB ·{" "}
                                  {formatRelative(d.uploadedAt)}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  d.status === "verified"
                                    ? "success"
                                    : d.status === "flagged"
                                      ? "warning"
                                      : d.status === "pending"
                                        ? "outline"
                                        : "brand"
                                }
                                size="sm"
                              >
                                {d.status === "pending" ? "awaiting details" : d.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="iconSm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      removeDocument(clientId, d.id);
                                      toast(`${d.name} removed`);
                                    }}
                                    className="text-[var(--danger)]"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </motion.div>
                          ))}
                        </div>
                      </motion.section>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Button
              size="lg"
              disabled={client.documents.length === 0}
              onClick={() => router.push(`/clients/${clientId}/analysis`)}
            >
              <ClipboardCheck className="h-4 w-4" />
              Verify identity
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Suggested for this client</CardTitle>
              <p className="text-xs text-[var(--foreground-muted)]">
                Based on a {client.entityType.toLowerCase()} in{" "}
                {client.industry.toLowerCase()}.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="flex flex-col gap-2.5">
                {suggestedDocuments.map((s) => {
                  const collected = client.documents.some(
                    (d) =>
                      d.name.toLowerCase().includes(s.name.split(".")[0].toLowerCase()) ||
                      d.category === s.category,
                  );
                  return (
                    <li
                      key={s.name}
                      className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                    >
                      <FileGlyph name={s.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{s.name}</p>
                        <p className="text-[11px] text-[var(--foreground-subtle)]">
                          {s.note}
                        </p>
                      </div>
                      {collected ? (
                        <Badge variant="success" size="sm">
                          Have it
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm">
                          Needed
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
