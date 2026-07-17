import type { Metadata } from "next";
import { AnalysisScreen } from "./analysis-screen";

export const metadata: Metadata = {
  title: "AI analysis · Sentinel",
};

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnalysisScreen clientId={id} />;
}
