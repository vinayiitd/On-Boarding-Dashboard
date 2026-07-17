"use client";

import * as React from "react";
import { nanoid } from "nanoid";
import type {
  AIAnalysis,
  Client,
  UploadedDocument,
} from "./types";
import { SEED_CLIENTS } from "./seed";
import { analyseClient } from "./ai";

/**
 * In-memory demo store. Kept intentionally minimal — a context provider,
 * a reducer, and a small selector API. Persisted to localStorage so the
 * demo survives refreshes but never leaks between browsers.
 */

interface StoreState {
  clients: Client[];
  hydrated: boolean;
}

type Action =
  | { type: "hydrate"; payload: Client[] }
  | { type: "addClient"; payload: Client }
  | { type: "updateClient"; payload: { id: string; patch: Partial<Client> } }
  | { type: "addDocuments"; payload: { clientId: string; documents: UploadedDocument[] } }
  | { type: "removeDocument"; payload: { clientId: string; documentId: string } }
  | { type: "verifyDocument"; payload: { clientId: string; documentId: string; data: Record<string, string> } }
  | { type: "runAnalysis"; payload: { clientId: string; analysis: AIAnalysis } }
  | { type: "recordDecision"; payload: { clientId: string; decision: NonNullable<Client["reviewerDecision"]>; complianceNotes?: string } };

const STORAGE_KEY = "sentinel.kyc.v1";

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "hydrate":
      return { clients: action.payload, hydrated: true };
    case "addClient":
      return { ...state, clients: [action.payload, ...state.clients] };
    case "updateClient":
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.id
            ? { ...c, ...action.payload.patch, updatedAt: new Date().toISOString() }
            : c,
        ),
      };
    case "addDocuments":
      return {
        ...state,
        clients: state.clients.map((c) => {
          if (c.id !== action.payload.clientId) return c;
          return {
            ...c,
            documents: [...c.documents, ...action.payload.documents],
            updatedAt: new Date().toISOString(),
            audit: [
              {
                id: nanoid(8),
                timestamp: new Date().toISOString(),
                actor: "Client Portal",
                actorRole: "Client",
                action: `Uploaded ${action.payload.documents.length} document${action.payload.documents.length === 1 ? "" : "s"}`,
                detail: action.payload.documents.map((d) => d.name).join(", "),
              },
              ...c.audit,
            ],
          };
        }),
      };
    case "removeDocument":
      return {
        ...state,
        clients: state.clients.map((c) => {
          if (c.id !== action.payload.clientId) return c;
          return {
            ...c,
            documents: c.documents.filter((d) => d.id !== action.payload.documentId),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case "verifyDocument": {
      const now = new Date().toISOString();
      return {
        ...state,
        clients: state.clients.map((c) => {
          if (c.id !== action.payload.clientId) return c;
          const doc = c.documents.find((d) => d.id === action.payload.documentId);
          return {
            ...c,
            documents: c.documents.map((d) =>
              d.id === action.payload.documentId
                ? {
                    ...d,
                    status: "verified",
                    verifiedData: action.payload.data,
                    verifiedAt: now,
                  }
                : d,
            ),
            updatedAt: now,
            audit: [
              {
                id: nanoid(8),
                timestamp: now,
                actor: "Reviewer",
                actorRole: "Reviewer",
                action: `Verified ${doc?.name ?? "document"}`,
                detail: Object.entries(action.payload.data)
                  .filter(([, v]) => v && v.length)
                  .slice(0, 2)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · "),
              },
              ...c.audit,
            ],
          };
        }),
      };
    }
    case "runAnalysis":
      return {
        ...state,
        clients: state.clients.map((c) => {
          if (c.id !== action.payload.clientId) return c;
          return {
            ...c,
            analysis: action.payload.analysis,
            risk: action.payload.analysis.risk,
            status:
              action.payload.analysis.overallStatus === "READY FOR REVIEW"
                ? "ready"
                : action.payload.analysis.overallStatus === "ESCALATE"
                  ? "escalated"
                  : "in_review",
            outstandingItems: action.payload.analysis.findings
              .filter((f) => f.status === "missing")
              .map((f) => f.label),
            updatedAt: new Date().toISOString(),
            audit: [
              {
                id: nanoid(8),
                timestamp: new Date().toISOString(),
                actor: "Sentinel AI",
                actorRole: "AI",
                action: "Ran compliance analysis",
                detail: `Risk ${action.payload.analysis.risk} · Confidence ${action.payload.analysis.confidence}%`,
              },
              ...c.audit,
            ],
          };
        }),
      };
    case "recordDecision":
      return {
        ...state,
        clients: state.clients.map((c) => {
          if (c.id !== action.payload.clientId) return c;
          return {
            ...c,
            status:
              action.payload.decision.decision === "Approved"
                ? "approved"
                : action.payload.decision.decision === "Escalated"
                  ? "escalated"
                  : "in_review",
            reviewerDecision: action.payload.decision,
            complianceNotes: action.payload.complianceNotes ?? c.complianceNotes,
            updatedAt: new Date().toISOString(),
            audit: [
              {
                id: nanoid(8),
                timestamp: new Date().toISOString(),
                actor: action.payload.decision.decidedBy,
                actorRole: "Reviewer",
                action: `Recorded decision: ${action.payload.decision.decision}`,
                detail: action.payload.decision.notes,
              },
              ...c.audit,
            ],
          };
        }),
      };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: StoreState;
  createClient: (data: Omit<Client, "id" | "reference" | "createdAt" | "updatedAt" | "documents" | "analysis" | "audit" | "outstandingItems" | "risk" | "status">) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  addDocuments: (clientId: string, files: File[]) => UploadedDocument[];
  removeDocument: (clientId: string, documentId: string) => void;
  verifyDocument: (
    clientId: string,
    documentId: string,
    data: Record<string, string>,
  ) => void;
  runAnalysis: (clientId: string) => AIAnalysis | null;
  recordDecision: (
    clientId: string,
    decision: NonNullable<Client["reviewerDecision"]>,
    complianceNotes?: string,
  ) => void;
  getClient: (id: string) => Client | undefined;
  resetDemo: () => void;
}

const StoreContext = React.createContext<StoreContextValue | null>(null);

function categoriseFile(name: string): UploadedDocument["category"] {
  const n = name.toLowerCase();
  if (n.includes("passport") || n.includes("licence") || n.includes("license") || n.includes("id"))
    return "Identity";
  if (n.includes("utility") || n.includes("bill") || n.includes("address"))
    return "Address";
  if (n.includes("asic") || n.includes("extract") || n.includes("abn") || n.includes("partnership"))
    return "Business";
  if (n.includes("trust") || n.includes("deed")) return "Trust";
  if (n.includes("beneficial") || n.includes("ubo") || n.includes("ownership"))
    return "Ownership";
  if (n.includes("source") || n.includes("funds") || n.includes("bank"))
    return "Financial";
  return "Other";
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, {
    clients: SEED_CLIENTS,
    hydrated: false,
  });

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Client[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "hydrate", payload: parsed });
          return;
        }
      }
    } catch {
      // ignore corrupt storage
    }
    dispatch({ type: "hydrate", payload: SEED_CLIENTS });
  }, []);

  React.useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.clients));
    } catch {
      // storage quota, private mode — ignore silently
    }
  }, [state.clients, state.hydrated]);

  const createClient = React.useCallback<StoreContextValue["createClient"]>(
    (data) => {
      const id = nanoid(10);
      const reference = `KYC-${(2842 + Math.floor(Math.random() * 400)).toString()}`;
      const now = new Date().toISOString();
      const client: Client = {
        id,
        reference,
        ...data,
        risk: "Low",
        status: "draft",
        createdAt: now,
        updatedAt: now,
        documents: [],
        analysis: null,
        outstandingItems: [],
        audit: [
          {
            id: nanoid(8),
            timestamp: now,
            actor: "Reviewer",
            actorRole: "Reviewer",
            action: "Created client profile",
          },
        ],
      };
      dispatch({ type: "addClient", payload: client });
      return client;
    },
    [],
  );

  const updateClient = React.useCallback((id: string, patch: Partial<Client>) => {
    dispatch({ type: "updateClient", payload: { id, patch } });
  }, []);

  const addDocuments = React.useCallback(
    (clientId: string, files: File[]) => {
      const documents: UploadedDocument[] = files.map((f) => ({
        id: nanoid(10),
        name: f.name,
        category: categoriseFile(f.name),
        sizeKb: Math.max(80, Math.round(f.size / 1024)),
        uploadedAt: new Date().toISOString(),
        // Newly uploaded documents start as pending until the reviewer
        // captures their fields on the Verify identity screen.
        status: "pending",
        pages: undefined,
      }));
      dispatch({ type: "addDocuments", payload: { clientId, documents } });
      return documents;
    },
    [],
  );

  const removeDocument = React.useCallback(
    (clientId: string, documentId: string) => {
      dispatch({ type: "removeDocument", payload: { clientId, documentId } });
    },
    [],
  );

  const verifyDocument = React.useCallback(
    (clientId: string, documentId: string, data: Record<string, string>) => {
      dispatch({ type: "verifyDocument", payload: { clientId, documentId, data } });
    },
    [],
  );

  const runAnalysis = React.useCallback(
    (clientId: string): AIAnalysis | null => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client) return null;
      const analysis = analyseClient(client);
      dispatch({ type: "runAnalysis", payload: { clientId, analysis } });
      return analysis;
    },
    [state.clients],
  );

  const recordDecision = React.useCallback<StoreContextValue["recordDecision"]>(
    (clientId, decision, complianceNotes) => {
      dispatch({
        type: "recordDecision",
        payload: { clientId, decision, complianceNotes },
      });
    },
    [],
  );

  const getClient = React.useCallback(
    (id: string) => state.clients.find((c) => c.id === id),
    [state.clients],
  );

  const resetDemo = React.useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "hydrate", payload: SEED_CLIENTS });
  }, []);

  const value = React.useMemo<StoreContextValue>(
    () => ({
      state,
      createClient,
      updateClient,
      addDocuments,
      removeDocument,
      verifyDocument,
      runAnalysis,
      recordDecision,
      getClient,
      resetDemo,
    }),
    [state, createClient, updateClient, addDocuments, removeDocument, verifyDocument, runAnalysis, recordDecision, getClient, resetDemo],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
