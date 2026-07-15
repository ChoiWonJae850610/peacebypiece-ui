import IssuedWorkOrderDocument from "./IssuedWorkOrderDocument";
import styles from "./IssuedWorkOrderPreview.module.css";
import type { LocalIssuedPdfRenderInput } from "@/lib/generated-documents/work-order-pdf/localRenderInput";

export default function GeneratedIssuedWorkOrderPreview({ input, embeddedQr }: {
  readonly input: LocalIssuedPdfRenderInput;
  readonly embeddedQr?: { readonly qrSvg: string; readonly expiresAt: string; readonly label: "문서 보기" };
}) {
  return (
    <main
      className={styles.shell}
      data-wafl-pdf-snapshot-sha={input.snapshotSha256}
      data-wafl-pdf-renderer-version={input.snapshot.rendererVersion}
      data-wafl-pdf-dto-schema-version={input.snapshot.dtoSchemaVersion}
      data-wafl-pdf-object-key-plan={input.objectKeyPlan}
      data-wafl-pdf-ready="true"
    >
      <script
        id="wafl-pdf-snapshot"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: input.canonicalSnapshotJson.replace(/</g, "\\u003c"),
        }}
      />
      <IssuedWorkOrderDocument
        data={input.snapshot.preview}
        embeddedQr={embeddedQr}
        representativeImageSrc={input.representativeImageDataUrl ?? undefined}
      />
    </main>
  );
}
