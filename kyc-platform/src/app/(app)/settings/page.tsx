import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Settings · Sentinel" };

export default function SettingsPage() {
  return (
    <ComingSoon
      eyebrow="Settings"
      title="Workspace settings"
      description="Team members, notification preferences, branded client portals and the appearance of your reports."
      bullets={[
        "Team members and role-based access",
        "White-labelled client portal domain",
        "Branded PDF report templates",
        "Notification & digest preferences",
      ]}
    />
  );
}
