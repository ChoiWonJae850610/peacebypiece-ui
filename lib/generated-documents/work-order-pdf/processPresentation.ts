export type IssuedPdfProcessPresentationCandidate = {
  readonly role: "factory" | "additional";
  readonly partnerName: string | null;
};

export function resolveIssuedPdfProcessPresentation<T extends IssuedPdfProcessPresentationCandidate>(
  processes: readonly T[],
): {
  readonly basicProcessPartnerName: string;
  readonly additionalProcesses: readonly T[];
} {
  const basicProcess = processes.find((process) => process.role === "factory");
  return {
    basicProcessPartnerName: basicProcess?.partnerName?.trim() || "미지정",
    additionalProcesses: processes.filter((process) => process.role === "additional"),
  };
}
