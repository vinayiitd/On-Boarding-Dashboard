import type { Reviewer } from "./types";

/**
 * Team of KYC reviewers displayed in assignment dropdowns
 * and throughout the app UI.
 */
export const REVIEWERS: Reviewer[] = [
  {
    id: "r-1",
    name: "Amelia Chen",
    role: "Senior Compliance Officer",
    email: "amelia@sentinel.au",
    initials: "AC",
  },
  {
    id: "r-2",
    name: "Marcus Whitmore",
    role: "AML Lead",
    email: "marcus@sentinel.au",
    initials: "MW",
  },
  {
    id: "r-3",
    name: "Priya Natarajan",
    role: "KYC Analyst",
    email: "priya@sentinel.au",
    initials: "PN",
  },
  {
    id: "r-4",
    name: "Jordan Baker",
    role: "Onboarding Specialist",
    email: "jordan@sentinel.au",
    initials: "JB",
  },
];

export function getReviewer(id: string): Reviewer {
  return REVIEWERS.find((r) => r.id === id) ?? REVIEWERS[0];
}
