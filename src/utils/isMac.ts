export function isMac(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iP(?:hone|[ao]d)/u.test(navigator.platform)
  );
}
