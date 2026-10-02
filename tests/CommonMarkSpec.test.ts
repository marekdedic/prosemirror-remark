import { tests } from "commonmark-spec";
import { micromark } from "micromark";
import { ProseMirrorUnified } from "prosemirror-unified";
import { expect, test } from "vitest";

import { MarkdownExtension } from "../src/MarkdownExtension";

const range = (from: number, to: number): Array<number> =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const knownFailures: Array<{ cause: string; examples: Array<number> }> = [
  {
    cause: "raw HTML is dropped (#1117)",
    examples: [
      21,
      31,
      ...range(148, 191),
      201,
      308,
      309,
      344,
      475,
      476,
      477,
      491,
      494,
      524,
      536,
      ...range(613, 617),
      623,
      ...range(625, 631),
      642,
      643,
    ],
  },
  {
    cause: "empty fenced code block throws (#1118)",
    examples: [126, 130, 144, 237],
  },
  {
    cause: "code block info string is lost (#1119)",
    examples: [24, 34, 142, 143, 146],
  },
  {
    cause: "loose list serializes as tight (#1120)",
    examples: [
      5, 109, 254, 263, 264, 270, 271, 273, 274, 286, 287, 288, 290, 317, 324,
      325,
    ],
  },
  {
    cause:
      "mark spanning several nodes serializes as separate marks (marekdedic/prosemirror-unified#1058)",
    examples: [
      393, 394, 395, 399, 404, 406, 410, 411, 413, 414, 415, 418, 419, 422, 424,
      428, 429, 430, 431, 432, 433, 470, 478, 479, 516, 519, 530, 554, 558, 559,
      638, 639,
    ],
  },
  {
    cause: "nested emphasis of the same type collapses",
    examples: [
      369, 373, 389, 407, 408, 409, 417, 425, 426, 427, 461, 463, 464, 465, 466,
      468,
    ],
  },
  {
    cause: "last duplicate link reference definition wins (#1121)",
    examples: [204, 544],
  },
  {
    cause:
      "link references sharing an identifier or adjacent are resolved wrongly (#1122)",
    examples: [533, 570],
  },
  {
    cause: "empty link is dropped (#1123)",
    examples: [484, 487],
  },
  {
    cause:
      "encoded line ending splits the paragraph (fixed in mdast-util-to-markdown 2.1.3)",
    examples: [39],
  },
];

const failureCauses = new Map(
  knownFailures.flatMap(({ cause, examples }) =>
    examples.map((example) => [example, cause] as const),
  ),
);

const pmu = new ProseMirrorUnified([new MarkdownExtension()]);

const render = (markdown: string): string =>
  micromark(markdown, {
    allowDangerousHtml: true,
    allowDangerousProtocol: true,
  });

const withTabs = (value: string): string => value.replace(/→/gu, "\t");

const examples = tests.map(({ html, markdown, number, section }) => ({
  cause: failureCauses.get(number),
  html: withTabs(html),
  markdown: withTabs(markdown),
  number,
  section,
}));

const roundTrip = (markdown: string): string =>
  render(pmu.serialize(pmu.parse(markdown)));

test("known failures reference existing examples", () => {
  const exampleNumbers = new Set(tests.map(({ number }) => number));

  expect(
    [...failureCauses.keys()].filter((example) => !exampleNumbers.has(example)),
  ).toStrictEqual([]);
});

test.each(examples.filter(({ cause }) => cause === undefined))(
  "example $number ($section)",
  ({ html, markdown }) => {
    expect(roundTrip(markdown)).toBe(html);
  },
);

test.fails.each(examples.filter(({ cause }) => cause !== undefined))(
  "example $number ($section): $cause",
  ({ html, markdown }) => {
    expect(roundTrip(markdown)).toBe(html);
  },
);
