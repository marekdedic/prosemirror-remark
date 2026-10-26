export function isMac(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iP(?:[ao]d|hone)/u.test(navigator.platform)
  );
}
