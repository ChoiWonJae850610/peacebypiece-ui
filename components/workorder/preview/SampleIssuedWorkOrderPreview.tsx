"use client";

import { Printer } from "lucide-react";

import type { WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";
import IssuedWorkOrderDocument, { type WorkOrderPreviewCoverFacts } from "./IssuedWorkOrderDocument";
import styles from "./IssuedWorkOrderPreview.module.css";

const sampleCoverFacts: WorkOrderPreviewCoverFacts = {
  productTypeLabel: "여성 원피스 / 여름 1차 생산",
  factoryName: "성수 어패럴",
  managerName: "김생산",
};

type PdfFoundationMetadata = {
  readonly snapshotSha256: string;
  readonly rendererVersion: string;
  readonly dtoSchemaVersion: number;
  readonly objectKeyPlan: string;
  readonly canonicalSnapshotJson: string;
};

export default function SampleIssuedWorkOrderPreview({
  data,
  representativeImageSrc = "/dev-samples/linen-round-dress-sketch.svg",
  pdfFoundationMetadata,
}: {
  readonly data: WorkOrderIssuedPreviewReadModel;
  readonly representativeImageSrc?: string;
  readonly pdfFoundationMetadata?: PdfFoundationMetadata;
}) {
  return (
    <main
      className={styles.shell}
      data-wafl-pdf-snapshot-sha={pdfFoundationMetadata?.snapshotSha256}
      data-wafl-pdf-renderer-version={pdfFoundationMetadata?.rendererVersion}
      data-wafl-pdf-dto-schema-version={pdfFoundationMetadata?.dtoSchemaVersion}
      data-wafl-pdf-object-key-plan={pdfFoundationMetadata?.objectKeyPlan}
    >
      {pdfFoundationMetadata ? (
        <script
          id="wafl-pdf-snapshot"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: pdfFoundationMetadata.canonicalSnapshotJson.replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <nav className={styles.toolbar} aria-label="샘플 작업지시서 도구">
        <div />
        <div><span>실무형 샘플 작업지시서</span><strong>{data.document.displayDocumentNumber}</strong></div>
        <button type="button" onClick={() => window.print()} title="인쇄"><Printer aria-hidden="true" /><span>인쇄</span></button>
      </nav>
      <IssuedWorkOrderDocument coverFacts={sampleCoverFacts} data={data} quantityUnit="장" representativeImageLabel="리넨 라운드 셔츠 원피스 앞면·뒷면 제품 스케치" representativeImageSrc={representativeImageSrc} />
    </main>
  );
}
