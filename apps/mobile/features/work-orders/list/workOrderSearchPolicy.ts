const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;
const HANGUL_INITIAL_INTERVAL = 588;

const COMPATIBILITY_INITIALS = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

const MODERN_INITIAL_TO_COMPATIBILITY = new Map(
  ["ᄀ", "ᄁ", "ᄂ", "ᄃ", "ᄄ", "ᄅ", "ᄆ", "ᄇ", "ᄈ", "ᄉ", "ᄊ", "ᄋ", "ᄌ", "ᄍ", "ᄎ", "ᄏ", "ᄐ", "ᄑ", "ᄒ"]
    .map((initial, index) => [initial, COMPATIBILITY_INITIALS[index]] as const),
);

const COMPATIBILITY_INITIAL_SET = new Set<string>(COMPATIBILITY_INITIALS);

export type WorkOrderSearchCorpus = {
  readonly productName: string;
  readonly displayDocumentNumber?: string | null;
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("ko-KR");
}

function normalizeInitialCharacter(character: string): string | null {
  if (COMPATIBILITY_INITIAL_SET.has(character)) return character;
  return MODERN_INITIAL_TO_COMPATIBILITY.get(character) ?? null;
}

export function normalizeHangulInitialQuery(value: string): string {
  return Array.from(normalizeSearchText(value), (character) => {
    if (character === " ") return character;
    return normalizeInitialCharacter(character) ?? character;
  }).join("");
}

export function isHangulInitialQuery(value: string): boolean {
  const normalized = normalizeHangulInitialQuery(value).replace(/\s/gu, "");
  return normalized.length > 0
    && Array.from(normalized).every((character) => COMPATIBILITY_INITIAL_SET.has(character));
}

export function extractHangulInitials(value: string): string {
  return Array.from(normalizeSearchText(value), (character) => {
    if (character === " ") return character;
    const normalizedInitial = normalizeInitialCharacter(character);
    if (normalizedInitial) return normalizedInitial;
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined || codePoint < HANGUL_SYLLABLE_START || codePoint > HANGUL_SYLLABLE_END) {
      return "";
    }
    return COMPATIBILITY_INITIALS[Math.floor((codePoint - HANGUL_SYLLABLE_START) / HANGUL_INITIAL_INTERVAL)];
  }).join("").replace(/\s+/gu, " ").trim();
}

export function matchesWorkOrderSearch(item: WorkOrderSearchCorpus, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const normalizedCorpus = normalizeSearchText([
    item.productName,
    item.displayDocumentNumber ?? "",
  ].join(" "));
  if (normalizedCorpus.includes(normalizedQuery)) return true;
  if (!isHangulInitialQuery(normalizedQuery)) return false;

  return extractHangulInitials(normalizedCorpus).includes(normalizeHangulInitialQuery(normalizedQuery));
}
