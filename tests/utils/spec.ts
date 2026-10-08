import type { ProseMirrorUnified } from "prosemirror-unified";

import { expect, test } from "vitest";

export interface KnownFailure {
  cause: string;
  examples: Array<number>;
}

export interface SpecExample {
  html: string;
  markdown: string;
  number: number;
  section: string;
}

const withTabs = (value: string): string => value.replace(/→/gu, "\t");

export function testSpecExamples(
  pmu: ProseMirrorUnified,
  render: (markdown: string) => string,
  specExamples: Array<SpecExample>,
  knownFailures: Array<KnownFailure>,
): void {
  const failureCauses = new Map(
    knownFailures.flatMap(({ cause, examples }) =>
      examples.map((example) => [example, cause] as const),
    ),
  );

  const examples = specExamples.map(({ html, markdown, number, section }) => ({
    cause: failureCauses.get(number),
    html: withTabs(html),
    markdown: withTabs(markdown),
    number,
    section,
  }));

  const roundTrip = (markdown: string): string =>
    render(pmu.serialize(pmu.parse(markdown)));

  test("known failures reference existing examples", () => {
    const exampleNumbers = new Set(specExamples.map(({ number }) => number));

    expect(
      [...failureCauses.keys()].filter(
        (example) => !exampleNumbers.has(example),
      ),
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
}
