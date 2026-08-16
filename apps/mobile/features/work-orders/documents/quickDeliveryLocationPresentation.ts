export type QuickDeliveryLocationPresentationInput = {
  readonly mode: "unset" | "partner" | "direct";
  readonly place: string;
  readonly zonecode: string;
  readonly basicAddress: string;
  readonly detailAddress: string;
  readonly contact: string;
  readonly partnerName?: string | null;
  readonly partnerContact?: string | null;
};

export type QuickDeliveryLocationPresentation = {
  readonly primary: string;
  readonly secondary: string | null;
};

function joinNonEmpty(values: readonly string[]) {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized.join(" · ") : null;
}

export function presentQuickDeliveryLocation(
  input: QuickDeliveryLocationPresentationInput,
  unsetLabel: string,
): QuickDeliveryLocationPresentation {
  if (input.mode === "partner") {
    return {
      primary: input.partnerName?.trim() || unsetLabel,
      secondary: input.partnerContact?.trim() || null,
    };
  }
  if (input.mode === "direct") {
    const address = joinNonEmpty([input.zonecode, input.basicAddress, input.detailAddress]);
    return {
      primary: address ?? unsetLabel,
      secondary: input.contact.trim() || null,
    };
  }
  return { primary: unsetLabel, secondary: null };
}
