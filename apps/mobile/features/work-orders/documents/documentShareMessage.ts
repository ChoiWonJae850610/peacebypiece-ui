export type WorkOrderShareMessageInput = {
  readonly productName: string;
  readonly totalQuantity: number;
  readonly dueDate: string | null;
  readonly viewerUrl: string;
};

export function buildWorkOrderShareMessage(input: WorkOrderShareMessageInput): string {
  const productName = input.productName.trim() || "작업지시서";
  return [
    "WAFL에서 작업지시서를 공유했습니다.",
    "",
    productName,
    `수량 ${input.totalQuantity.toLocaleString("ko-KR")}개 · 납기 ${input.dueDate ?? "미지정"}`,
    "",
    "아래 링크에서 작업지시서를 확인해 주세요.",
    input.viewerUrl,
    "",
    "WAFL과 함께 더 간편하게 제작 업무를 관리해 보세요.",
  ].join("\n");
}
