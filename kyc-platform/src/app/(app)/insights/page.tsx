import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Insights · Sentinel" };

export default function InsightsPage() {
  return (
    <ComingSoon
      eyebrow="Insights"
      title="Portfolio-wide risk insights"
      description="Trends across your entire book — risk mix, onboarding cycle time, reviewer capacity and AI accuracy."
      bullets={[
        "Onboarding cycle time by entity type",
        "Risk drift across your book",
        "Reviewer capacity vs. inbound volume",
        "AI vs. reviewer decision agreement",
      ]}
    />
  );
}
