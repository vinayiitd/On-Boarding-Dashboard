import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Support · Sentinel" };

export default function SupportPage() {
  return (
    <ComingSoon
      eyebrow="Support"
      title="We're a chat away"
      description="Talk to a real compliance specialist backed by Sentinel. Weekdays 8am – 8pm AEDT."
      bullets={[
        "Live chat with an AML specialist",
        "Regulatory update briefings each fortnight",
        "1:1 onboarding for new firms",
        "Priority queue for high-risk cases",
      ]}
    />
  );
}
