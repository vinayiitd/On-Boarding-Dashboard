import type { Metadata } from "next";
import { ClientsListScreen } from "../clients/clients-list-screen";

export const metadata: Metadata = {
  title: "Reviews · Sentinel",
};

export default function ReviewsPage() {
  return <ClientsListScreen mode="reviews" />;
}
