import type { Metadata } from "next";
import { ReportScreen } from "./report-screen";

export const metadata: Metadata = {
  title: "Compliance report · Sentinel",
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportScreen clientId={id} />;
}
