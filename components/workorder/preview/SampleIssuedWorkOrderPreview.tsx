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

export default function SampleIssuedWorkOrderPreview({ data }: { readonly data: WorkOrderIssuedPreviewReadModel }) {
  return (
    <main className={styles.shell}>
      <nav className={styles.toolbar} aria-label="샘플 작업지시서 도구">
        <div />
        <div><span>내부 검토용 샘플</span><strong>{data.document.displayDocumentNumber}</strong></div>
        <button type="button" onClick={() => window.print()} title="인쇄"><Printer aria-hidden="true" /><span>인쇄</span></button>
      </nav>
      <IssuedWorkOrderDocument coverFacts={sampleCoverFacts} data={data} quantityUnit="장" representativeImageSrc="/dev-samples/linen-round-dress-sketch.svg" />
    </main>
  );
}
