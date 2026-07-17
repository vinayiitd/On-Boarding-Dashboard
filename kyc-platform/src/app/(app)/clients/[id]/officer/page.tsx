import type { Metadata } from "next";
import { OfficerScreen } from "./officer-screen";

export const metadata: Metadata = {
  title: "AI Compliance Officer · Sentinel",
};

export default async function OfficerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OfficerScreen clientId={id} />;
}
