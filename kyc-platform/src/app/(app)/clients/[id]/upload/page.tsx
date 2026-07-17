import type { Metadata } from "next";
import { UploadScreen } from "./upload-screen";

export const metadata: Metadata = {
  title: "Upload documents · Sentinel",
};

export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UploadScreen clientId={id} />;
}
