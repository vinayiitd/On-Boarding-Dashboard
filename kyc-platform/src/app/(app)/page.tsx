import type { Metadata } from "next";
import { DashboardScreen } from "./dashboard/dashboard-screen";

export const metadata: Metadata = {
  title: "Dashboard · Sentinel",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
