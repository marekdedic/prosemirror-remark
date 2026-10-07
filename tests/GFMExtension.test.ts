import type { Node as ProseMirrorNode } from "prosemirror-model";

import { ProseMirrorUnified } from "prosemirror-unified";
import { expect, test } from "vitest";

import { GFMExtension } from "../src/GFMExtension";
import { createBuilders } from "./utils/fixture";

const pmu = new ProseMirrorUnified([new GFMExtension()]);
const b = createBuilders(pmu.schema());

const doc = b.doc(
  b.blockquote(b.p("Inside a blockquote")),
  b.p("Paragraph with a", b.br(), "hard break"),
  b.code_block("Code"),
  b.heading("Hello"),
  b.hr(),
  b.p(b.img({ alt: "Awesome image", src: "https://example.test" })),
  b.p(b.img({ alt: "Image 2", src: "https://img2.test" })),
  b.ol(b.li(b.p("Ordered list"))),
  b.ul(b.li(b.p("Unordered list")), b.taskListItem(b.p("Task list"))),
  b.p(
    "A text with a ",
    b.strong("bold part"),
    ", some ",
    b.code("inline code"),
    ", a bit ",
    b.em("that is italic"),
    ", one that is ",
    b.strikethrough("striked through"),
    ", one ",
    b.link({ href: "https://example.test" }, "link"),
    ", one simple link to ",
    b.link({ href: "http://www.github.com" }, "www.github.com"),
    " and another ",
    b.link({ href: "https://link2.test" }, "type of link"),
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
        "- [ ] Task list\n" +
        "\n" +
        "A text with a **bold part**, some `inline code`, a bit *that is italic*, one that is ~striked through~, one [link](https://example.test), one simple link to www.github.com and another [type of link][link2].\n" +
        "\n" +
        "[link2]: https://link2.test",
    ),
  ).toEqualProseMirrorNode(doc);
});

test("ProseMirror -> unist conversion", () => {
  expect(pmu.serialize(doc)).toBe(
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
      "![Image 2](https://img2.test)\n" +
      "\n" +
      "1. Ordered list\n" +
      "\n" +
      "* Unordered list\n" +
      "* [ ] Task list\n" +
      "\n" +
      "A text with a **bold part**, some `inline code`, a bit *that is italic*, one that is ~~striked through~~, one [link](https://example.test), one simple link to [www.github.com](http://www.github.com) and another [type of link](https://link2.test).\n",
  );
});

test.each([
  [
    "[a ~~striked~~ part](https://example.test)",
    b.link(
      { href: "https://example.test" },
      "a ",
      b.strikethrough("striked"),
      " part",
    ),
  ],
  [
    "~~a [link](https://example.test) part~~",
    b.strikethrough(
      "a ",
      b.link({ href: "https://example.test" }, "link"),
      " part",
    ),
  ],
  ["~~a *nested* part~~", b.strikethrough("a ", b.em("nested"), " part")],
])("mark spanning several nodes %s", (markdown, marked) => {
  const node = b.doc(b.p(marked)) as unknown as ProseMirrorNode;

  expect(pmu.parse(markdown)).toEqualProseMirrorNode(node);
  expect(pmu.serialize(node)).toBe(`${markdown}\n`);
});

test.each([
  ["~~`code`~~", b.strikethrough(b.code("code"))],
  ["**~~`code`~~**", b.strong(b.strikethrough(b.code("code")))],
])("inline code with other marks %s", (markdown, marked) => {
  const node = b.doc(b.p(marked)) as unknown as ProseMirrorNode;

  expect(pmu.parse(markdown)).toEqualProseMirrorNode(node);
  expect(pmu.serialize(node)).toBe(`${markdown}\n`);
});

test.each([
  [
    "only task items",
    "- [ ] a\n- [x] b\n\n  [ref]: /url\n- [ ] d\n",
    "* [ ] a\n\n* [x] b\n\n* [ ] d\n",
  ],
  [
    "a task item among regular items",
    "- a\n- [x] b\n\n  [ref]: /url\n- d\n",
    "* a\n\n* [x] b\n\n* d\n",
  ],
])(
  "task list with %s made loose only by a definition",
  (_, markdown, serialized) => {
    expect(pmu.serialize(pmu.parse(markdown))).toBe(serialized);
  },
);
