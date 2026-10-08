import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ProseMirrorUnified } from "prosemirror-unified";

import { GFMExtension } from "../src/GFMExtension";
import {
  type KnownFailure,
  type SpecExample,
  testSpecExamples,
} from "./utils/spec";

const knownFailures: Array<KnownFailure> = [
  {
    cause: "tables aren't supported (#275)",
    examples: [200],
  },
  {
    cause: "micromark doesn't autolink ftp: URLs",
    examples: [628],
  },
  {
    cause: "raw HTML is dropped (#1117)",
    examples: [652],
  },
];

const extractExamples = (spec: string): Array<SpecExample> => {
  const examples: Array<SpecExample> = [];
  let section = "";
  let number = 0;
  spec
    .replace(/\r\n?/gu, "\n")
    .replace(/^<!-- END TESTS -->[\s\S]*/mu, "")
    .replace(
      /^`{32} example(?: (\w+))?\n([\s\S]*?)^\.\n([\s\S]*?)^`{32}$|^#{1,6} *(.*)$/gmu,
      (
        _,
        extension: string | undefined,
        markdown: string,
        html: string,
        heading: string | undefined,
      ) => {
        if (heading === undefined) {
          number++;
          if (extension !== undefined) {
            examples.push({ html, markdown, number, section });
          }
        } else {
          section = heading;
        }
        return "";
      },
    );
  return examples;
};

const pmu = new ProseMirrorUnified([new GFMExtension()]);

const render = (markdown: string): string =>
  micromark(markdown, {
    allowDangerousHtml: true,
    allowDangerousProtocol: true,
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  }).replace(
    /<input type="checkbox" disabled=""( checked="")? \/>/gu,
    '<input$1 disabled="" type="checkbox">',
  );

const specExamples = extractExamples(
  readFileSync(
    join(import.meta.dirname, "spec", "gfm-spec-0.29-gfm.txt"),
    "utf8",
  ),
);

testSpecExamples(pmu, render, specExamples, knownFailures);
