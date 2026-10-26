export function isMac(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iP(?:hone|[oa]d)/u.test(navigator.platform)
  );
}
