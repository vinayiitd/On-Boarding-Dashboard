"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  DollarSign,
  Globe2,
  Info,
  Sparkles,
  User,
  UserRoundCog,
  Users2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { REVIEWERS } from "@/lib/reviewers";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  Country,
  CustomerSegment,
  EntityType,
  Industry,
} from "@/lib/types";

interface FormValues {
  name: string;
  entityType: EntityType;
  industry: Industry;
  country: Country;
  segment: CustomerSegment;
  expectedTransactionAmount: number;
  purpose: string;
  reviewerId: string;
}

const entityOptions: {
  value: EntityType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "Individual",
    label: "Individual",
    description: "A single natural person",
    icon: User,
  },
  {
    value: "Company",
    label: "Company",
    description: "Pty Ltd or Ltd company registered with ASIC",
    icon: Building2,
  },
  {
    value: "Trust",
    label: "Trust",
    description: "Family, unit or discretionary trust",
    icon: Briefcase,
  },
  {
    value: "Partnership",
    label: "Partnership",
    description: "Two or more partners operating a business",
    icon: Users2,
  },
];

const INDUSTRIES: Industry[] = [
  "Legal",
  "Accounting",
  "Real Estate",
  "Construction",
  "Retail",
  "Hospitality",
  "Technology",
  "Mining",
  "Agriculture",
  "Financial Services",
  "Import / Export",
  "Other",
];

const COUNTRIES: Country[] = [
  "Australia",
  "New Zealand",
  "United Kingdom",
  "United States",
  "Singapore",
  "Hong Kong",
  "United Arab Emirates",
  "Other",
];

const SEGMENTS: CustomerSegment[] = ["Accountant", "Lawyer", "Real Estate"];

export function CreateClientScreen() {
  const router = useRouter();
  const { createClient } = useStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      name: "",
      entityType: "Company",
      industry: "Accounting",
      country: "Australia",
      segment: "Accountant",
      expectedTransactionAmount: 500_000,
      purpose: "",
      reviewerId: REVIEWERS[0].id,
    },
  });

  const entityType = watch("entityType");

  async function onSubmit(values: FormValues) {
    const client = createClient({
      name: values.name.trim(),
      entityType: values.entityType,
      industry: values.industry,
      country: values.country,
      segment: values.segment,
      expectedTransactionAmount: Number(values.expectedTransactionAmount) || 0,
      purpose: values.purpose.trim(),
      reviewerId: values.reviewerId,
    });
    toast.success("Client created", {
      description: `${client.name} · ${client.reference}. Let's upload their documents next.`,
    });
    router.push(`/clients/${client.id}/upload`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/clients", label: "Clients" },
          { label: "New" },
        ]}
        eyebrow="Onboarding · Step 1 of 4"
        title="Create a new client"
        description="Tell Sentinel who you're onboarding. We'll draft the KYC pack and request the right documents automatically."
        actions={
          <Button variant="outline" size="md" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="mt-6">
        <StepIndicator current={1} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="flex flex-col gap-6">
          {/* Basic details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[var(--foreground-subtle)]" />
                Basic details
              </CardTitle>
              <p className="text-sm text-[var(--foreground-muted)]">
                The legal entity being onboarded.
              </p>
            </CardHeader>
            <CardContent className="pt-0 grid gap-5">
              <Field
                label="Client name"
                required
                error={errors.name?.message}
                helper="The legal name as it appears on identity documents."
              >
                <Input
                  placeholder="e.g. Atlas Holdings Pty Ltd"
                  {...register("name", {
                    required: "Client name is required",
                    minLength: {
                      value: 2,
                      message: "Client name must be at least 2 characters",
                    },
                  })}
                />
              </Field>

              <div>
                <Label className="mb-2 block">Entity type</Label>
                <Controller
                  control={control}
                  name="entityType"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {entityOptions.map((option) => {
                        const active = field.value === option.value;
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "group relative flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all",
                              active
                                ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_6%,var(--surface))] shadow-[0_0_0_3px_var(--ring)]/40"
                                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:-translate-y-0.5",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg",
                                active
                                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                                  : "bg-[var(--surface-muted)] text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{option.label}</p>
                              <p className="text-[11px] leading-snug text-[var(--foreground-muted)] line-clamp-2">
                                {option.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-[var(--foreground-subtle)]" />
                Context
              </CardTitle>
              <p className="text-sm text-[var(--foreground-muted)]">
                Where the client operates and what they need.
              </p>
            </CardHeader>
            <CardContent className="pt-0 grid gap-5 md:grid-cols-2">
              <Field label="Industry" required>
                <Controller
                  control={control}
                  name="industry"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Country of registration" required>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field
                label="Customer segment"
                required
                helper="Which of your practice areas does this client belong to?"
              >
                <Controller
                  control={control}
                  name="segment"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select segment" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEGMENTS.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field
                label="Expected transaction amount"
                required
                error={errors.expectedTransactionAmount?.message}
                helper="Estimated annual transaction volume in AUD."
              >
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1000}
                    className="pl-9 tabular-nums"
                    {...register("expectedTransactionAmount", {
                      valueAsNumber: true,
                      required: "Expected amount is required",
                      min: {
                        value: 0,
                        message: "Amount must be non-negative",
                      },
                    })}
                  />
                </div>
              </Field>
            </CardContent>
          </Card>

          {/* Purpose */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRoundCog className="h-4 w-4 text-[var(--foreground-subtle)]" />
                Purpose & assignment
              </CardTitle>
              <p className="text-sm text-[var(--foreground-muted)]">
                Give context and pick a reviewer.
              </p>
            </CardHeader>
            <CardContent className="pt-0 grid gap-5">
              <Field
                label="Purpose of the relationship"
                required
                error={errors.purpose?.message}
                helper="A short description of what this client needs from your firm."
              >
                <Textarea
                  rows={4}
                  placeholder="e.g. Commercial property acquisition in Melbourne CBD, requiring conveyancing and trust account services."
                  {...register("purpose", {
                    required: "Purpose is required",
                    minLength: {
                      value: 10,
                      message: "Please provide at least 10 characters",
                    },
                  })}
                />
              </Field>
              <Field label="Assigned reviewer" required>
                <Controller
                  control={control}
                  name="reviewerId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reviewer" />
                      </SelectTrigger>
                      <SelectContent>
                        {REVIEWERS.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} · {r.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Continue to documents"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* AI hint panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div
              aria-hidden
              className="absolute -right-10 -top-16 h-40 w-40 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%)",
              }}
            />
            <div className="relative flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">What Sentinel will do next</p>
            </div>
            <ol className="relative mt-4 flex flex-col gap-3 text-sm text-[var(--foreground-muted)]">
              {[
                `Draft the KYC pack for a ${entityType.toLowerCase()}`,
                "Request the right documents from your client",
                "Screen against sanctions & PEP lists",
                "Draft a compliance recommendation for you",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[10px] font-semibold text-[var(--foreground-muted)]">
                    {i + 1}
                  </span>
                  <span className="text-pretty">{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
              Regulatory context
            </p>
            <p className="mt-2 text-sm text-[var(--foreground-muted)] leading-relaxed">
              Tranche 2 brings Australian accountants, lawyers and real estate
              agencies under the AML/CTF Act. Sentinel keeps you aligned with
              AUSTRAC guidance for customer identification, ongoing due
              diligence and record-keeping.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="flex items-center gap-1.5">
        {label}
        {required ? (
          <span className="text-[var(--danger)]" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      ) : helper ? (
        <p className="text-xs text-[var(--foreground-subtle)]">{helper}</p>
      ) : null}
    </div>
  );
}

