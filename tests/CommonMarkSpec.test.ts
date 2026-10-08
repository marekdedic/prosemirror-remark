import { tests } from "commonmark-spec";
import { micromark } from "micromark";
import { ProseMirrorUnified } from "prosemirror-unified";

import { MarkdownExtension } from "../src/MarkdownExtension";
import { type KnownFailure, testSpecExamples } from "./utils/spec";

const range = (from: number, to: number): Array<number> =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const knownFailures: Array<KnownFailure> = [
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
    cause: "code block info string is lost (#1119)",
    examples: [24, 34, 142, 143, 144, 146],
  },
  {
    cause: "nested emphasis of the same type collapses (accepted limitation)",
    examples: [
      369, 373, 389, 407, 408, 409, 417, 418, 419, 425, 426, 427, 432, 461, 463,
      464, 465, 466, 468,
    ],
  },
  {
    cause: "empty link is dropped (accepted limitation)",
    examples: [484, 487],
  },
];

const pmu = new ProseMirrorUnified([new MarkdownExtension()]);

const render = (markdown: string): string =>
  micromark(markdown, {
    allowDangerousHtml: true,
    allowDangerousProtocol: true,
  });

testSpecExamples(pmu, render, tests, knownFailures);
