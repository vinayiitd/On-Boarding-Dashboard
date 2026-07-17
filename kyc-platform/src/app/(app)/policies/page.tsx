import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Policies · Sentinel" };

export default function PoliciesPage() {
  return (
    <ComingSoon
      eyebrow="Policies"
      title="Your compliance policies, versioned"
      description="Codify your AML/CTF program, keep every version, and let Sentinel apply it to every new client automatically."
      bullets={[
        "Version-controlled AML/CTF program",
        "Custom risk matrix per practice area",
        "Escalation rules by transaction size",
        "Auto-sync policy changes to every open case",
      ]}
    />
  );
}
