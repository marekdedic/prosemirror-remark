import { expect, test } from "vitest";

import css from "../style/style.css?raw";

function declarations(): Array<[string, string]> {
  return css
    .split("}")
    .flatMap((rule) => (rule.split("{")[1] ?? "").split(";"))
    .map((declaration) => declaration.split(":"))
    .filter((parts) => parts.length > 1)
    .map(([property, ...value]): [string, string] => [
      property.trim(),
      value.join(":").trim(),
    ]);
}

test("The stylesheet has declarations", () => {
  expect(declarations()).not.toHaveLength(0);
});

test("The stylesheet uses no physical left/right properties", () => {
  expect(
    declarations().filter(([property]) =>
      /(?:^|-)(?:left|right)(?:-|$)/u.test(property),
    ),
  ).toStrictEqual([]);
});

test("The stylesheet uses no physical left/right values", () => {
  expect(
    declarations().filter(([, value]) => /\b(?:left|right)\b/u.test(value)),
  ).toStrictEqual([]);
});
