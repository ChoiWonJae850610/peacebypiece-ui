export function normalizeBusinessRegistrationNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function formatBusinessRegistrationNumber(value: string): string {
  const digits = normalizeBusinessRegistrationNumber(value);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 5);
  const third = digits.slice(5, 10);

  return [first, second, third].filter(Boolean).join("-");
}
