/** Short, sortable-enough unique ids. Crypto when available, fallback otherwise. */
export function uid(prefix = ''): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}${prefix ? '_' : ''}${Date.now().toString(36)}${rand}`;
}
