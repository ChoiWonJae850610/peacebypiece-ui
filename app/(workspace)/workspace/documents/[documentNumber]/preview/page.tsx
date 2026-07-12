import DocumentNumberPreviewResolver from "@/components/workorder/preview/DocumentNumberPreviewResolver";

export const dynamic = "force-dynamic";

export default async function DocumentNumberPreviewPage({ params }: { readonly params: Promise<{ documentNumber: string }> }) {
  const { documentNumber } = await params;
  return <DocumentNumberPreviewResolver documentNumber={documentNumber}/>;
}
