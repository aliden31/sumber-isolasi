export function generateId(prefix?: string) {
  const random = typeof crypto !== "undefined" && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}-${random}` : random;
}
