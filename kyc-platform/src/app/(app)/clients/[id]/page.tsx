import type { Metadata } from "next";
import { ClientDetailScreen } from "./client-detail-screen";

export const metadata: Metadata = {
  title: "Client · Sentinel",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailScreen clientId={id} />;
}
