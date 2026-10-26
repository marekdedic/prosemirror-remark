let lastId = 0;

export function uniqueId(prefix: string): string {
  lastId += 1;
  return `${prefix}-${String(lastId)}`;
}
