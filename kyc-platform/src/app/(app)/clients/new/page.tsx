import type { Metadata } from "next";
import { CreateClientScreen } from "./create-client-screen";

export const metadata: Metadata = {
  title: "New client · Sentinel",
};

export default function NewClientPage() {
  return <CreateClientScreen />;
}
