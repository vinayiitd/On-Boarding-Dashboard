import type { Metadata } from "next";
import { ClientsListScreen } from "./clients-list-screen";

export const metadata: Metadata = {
  title: "Clients · Sentinel",
};

export default function ClientsPage() {
  return <ClientsListScreen mode="all" />;
}
