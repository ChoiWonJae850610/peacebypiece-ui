import GeneratedIssuedWorkOrderPreview from "@/components/workorder/preview/GeneratedIssuedWorkOrderPreview";
import { readLocalIssuedPdfRenderInput } from "@/lib/generated-documents/work-order-pdf/localRenderInput";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";

export const dynamic = "force-dynamic";

export default async function WorkOrderPdfRenderPage({ params }: {
  readonly params: Promise<{ readonly runToken: string }>;
}) {
  await assertLocalOnlyRouteHost();
  const { runToken } = await params;
  const input = await readLocalIssuedPdfRenderInput(runToken);
  return <GeneratedIssuedWorkOrderPreview input={input} />;
}
