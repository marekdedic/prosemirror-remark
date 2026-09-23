import type { Node as ProseMirrorNode } from "prosemirror-model";

import { ProseMirrorUnified } from "prosemirror-unified";
import { expect, test } from "vitest";

import { MarkdownExtension } from "../src/MarkdownExtension";
import { createBuilders } from "./utils/fixture";

const pmu = new ProseMirrorUnified([new MarkdownExtension()]);
const b = createBuilders(pmu.schema());

const parsedDoc = b.doc(
  b.blockquote(b.p("Inside a blockquote")),
  b.p("Paragraph with a", b.br(), "hard break"),
  b.code_block("Code"),
  b.heading("Hello"),
  b.hr(),
  b.p(b.img({ alt: "Awesome image", src: "https://example.test" })),
  b.p(b.img({ alt: "Image 2", src: "https://img2.test" })),
  b.ol(b.li(b.p("Ordered list"))),
  b.ul(b.li(b.p("Unordered list"))),
  b.p(
    "A text with a ",
    b.strong("bold part"),
    ", some ",
    b.code("inline code"),
    ", a bit ",
    b.em("that is italic"),
    ", one ",
    b.link({ href: "https://example.test" }, "link"),
    " and another ",
    b.link({ href: "https://link2.test" }, "type of link"),
    ".",
  ),
) as unknown as ProseMirrorNode;

const serializedDoc = b.doc(
  b.blockquote(b.p("Inside a blockquote")),
  b.p("Paragraph with a", b.br(), "hard break"),
  b.code_block("Code"),
  b.heading("Hello"),
  b.hr(),
  b.p(b.img({ alt: "Awesome image", src: "https://example.test" })),
  b.ol(b.li(b.p("Ordered list"))),
  b.ul(b.li(b.p("Unordered list"))),
  b.p(
    "A text with a ",
    b.strong("bold part"),
    ", some ",
    b.code("inline code"),
    ", a bit ",
    b.em("that is italic"),
    ", one ",
    b.link({ href: "https://example.test" }, "link"),
    ".",
  ),
) as unknown as ProseMirrorNode;

test("unist -> ProseMirror conversion", () => {
  expect(
    pmu.parse(
      "> Inside a blockquote\n" +
        "\n" +
        "Paragraph with a  \n" +
        "hard break\n" +
        "```\nCode\n```\n" +
        "# Hello\n" +
        "***\n" +
        "![Awesome image](https://example.test)\n" +
        "\n" +
        "![Image 2][img2]\n" +
        "\n" +
        "[img2]: https://img2.test\n" +
        "\n" +
        "1. Ordered list\n" +
        "\n" +
        "- Unordered list\n" +
        "\n" +
        "A text with a **bold part**, some `inline code`, a bit *that is italic*, one [link](https://example.test) and another [type of link][link2].\n" +
        "\n" +
        "[link2]: https://link2.test",
    ),
  ).toEqualProseMirrorNode(parsedDoc);
});

test("ProseMirror -> unist conversion", () => {
  expect(pmu.serialize(serializedDoc)).toBe(
    "> Inside a blockquote\n" +
      "\n" +
      "Paragraph with a\\\n" +
      "hard break\n" +
      "\n" +
      "```\nCode\n```\n" +
      "\n" +
      "# Hello\n" +
      "\n" +
      "---\n" +
      "\n" +
      "![Awesome image](https://example.test)\n" +
      "\n" +
      "1. Ordered list\n" +
      "\n" +
      "* Unordered list\n" +
      "\n" +
      "A text with a **bold part**, some `inline code`, a bit *that is italic*, one [link](https://example.test).\n",
  );
});
