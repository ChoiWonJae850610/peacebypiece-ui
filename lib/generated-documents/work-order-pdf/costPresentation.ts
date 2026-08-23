import type { DecimalString } from "@/lib/domain/work-orders/contracts";

type IssuedPdfProcessCostCandidate = {
  readonly role: "factory" | "additional";
  readonly unitPrice: DecimalString;
  readonly amount: DecimalString;
};

export function resolveIssuedPdfCostPresentation(input: {
  readonly processes: readonly IssuedPdfProcessCostCandidate[];
}): {
  readonly basicProcessUnitPrice: DecimalString;
  readonly basicProcessLaborAmount: DecimalString;
} {
  const basicProcess = input.processes.find((process) => process.role === "factory");
  return {
    basicProcessUnitPrice: basicProcess?.unitPrice ?? ("0" as DecimalString),
    basicProcessLaborAmount: basicProcess?.amount ?? ("0" as DecimalString),
  };
}

export function formatIssuedPdfWon(value: DecimalString): string {
  const parsed = Number(value);
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(Number.isFinite(parsed) ? parsed : 0)}원`;
}
