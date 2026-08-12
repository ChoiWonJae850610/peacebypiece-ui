export type WorkOrderStructureOptionKind = "size" | "color";

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const HEX_PATTERN = /^#[0-9A-F]{6}$/u;

export function normalizeWorkOrderStructureOptionName(value: unknown, kind: WorkOrderStructureOptionKind) {
  if (typeof value !== "string") return { ok: false as const, message: "이름을 입력해 주세요." };
  const displayName = value.normalize("NFKC").trim();
  const maximum = kind === "size" ? 40 : 80;
  if (!displayName || displayName.length > maximum || CONTROL_CHARACTER_PATTERN.test(displayName)) {
    return { ok: false as const, message: `${kind === "size" ? "사이즈" : "색상"} 이름은 1~${maximum}자로 입력해 주세요.` };
  }
  return { ok: true as const, displayName, normalizedName: displayName.toLocaleLowerCase("en-US") };
}

export function normalizeWorkOrderStructureOptionHex(value: unknown, kind: WorkOrderStructureOptionKind) {
  if (kind === "size") return { ok: true as const, hexValue: null };
  if (value === null || value === undefined || value === "") return { ok: true as const, hexValue: null };
  if (typeof value !== "string") return { ok: false as const, message: "색상 값은 #RRGGBB 형식이어야 합니다." };
  const hexValue = value.trim().toUpperCase();
  return HEX_PATTERN.test(hexValue)
    ? { ok: true as const, hexValue }
    : { ok: false as const, message: "색상 값은 #RRGGBB 형식이어야 합니다." };
}

export function isWorkOrderStructureOptionKind(value: unknown): value is WorkOrderStructureOptionKind {
  return value === "size" || value === "color";
}
