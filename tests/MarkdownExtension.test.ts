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

test.each([
  ["**_nested_**", b.strong(b.em("nested"))],
  ["_**nested**_", b.em(b.strong("nested"))],
  [
    "**[nested](https://example.test)**",
    b.strong(b.link({ href: "https://example.test" }, "nested")),
  ],
  [
    "_[nested](https://example.test)_",
    b.em(b.link({ href: "https://example.test" }, "nested")),
  ],
  ["**`nested`**", b.strong(b.code("nested"))],
])("unist -> ProseMirror conversion of nested marks %s", (markdown, marked) => {
  const parsed = pmu.parse(markdown);

  expect(() => {
    parsed.check();
  }).not.toThrow();
  expect(parsed).toEqualProseMirrorNode(
    b.doc(b.p(marked)) as unknown as ProseMirrorNode,
  );
});

test.each([
  ["a hard break", b.p(b.code("a", b.br(), "b")), "`a`\\\n`b`\n"],
  ["only a hard break", b.p("a", b.code(b.br()), "b"), "a\\\nb\n"],
  [
    "an image",
    b.p(b.code("a", b.img({ alt: "x", src: "https://i.test" }))),
    "`a`![x](https://i.test)\n",
  ],
  [
    "only an image",
    b.p(b.code(b.img({ alt: "x", src: "https://i.test" }))),
    "![x](https://i.test)\n",
  ],
])(
  "ProseMirror -> unist conversion of inline code on %s",
  (_, paragraph, markdown) => {
    const node = b.doc(paragraph) as unknown as ProseMirrorNode;

    expect(() => {
      node.check();
    }).not.toThrow();
    expect(pmu.serialize(node)).toBe(markdown);
  },
);

test.each([
  [
    "[a **bold** part](https://example.test)",
    b.p(
      b.link({ href: "https://example.test" }, "a ", b.strong("bold"), " part"),
    ),
  ],
  [
    "[an *italic* part](https://example.test)",
    b.p(
      b.link({ href: "https://example.test" }, "an ", b.em("italic"), " part"),
    ),
  ],
  [
    "[some `code` here](https://example.test)",
    b.p(
      b.link(
        { href: "https://example.test" },
        "some ",
        b.code("code"),
        " here",
      ),
    ),
  ],
  [
    "[**bold** and *italic*](https://example.test)",
    b.p(
      b.link(
        { href: "https://example.test" },
        b.strong("bold"),
        " and ",
        b.em("italic"),
      ),
    ),
  ],
  [
    '[a **bold** part](https://example.test "Title")',
    b.p(
      b.link(
        { href: "https://example.test", title: "Title" },
        "a ",
        b.strong("bold"),
        " part",
      ),
    ),
  ],
  [
    "[an ![image](https://img.test)](https://example.test)",
    b.p(
      b.link(
        { href: "https://example.test" },
        "an ",
        b.img({ alt: "image", src: "https://img.test" }),
      ),
    ),
  ],
  [
    "[a\\\nbreak](https://example.test)",
    b.p(b.link({ href: "https://example.test" }, "a", b.br(), "break")),
  ],
  ["**a *nested* part**", b.p(b.strong("a ", b.em("nested"), " part"))],
  ["*a **nested** part*", b.p(b.em("a ", b.strong("nested"), " part"))],
  [
    "**a [link](https://example.test) part**",
    b.p(
      b.strong("a ", b.link({ href: "https://example.test" }, "link"), " part"),
    ),
  ],
  ["**a\\\nbreak**", b.p(b.strong("a", b.br(), "break"))],
  [
    "# [a **bold** part](https://example.test)",
    b.heading(
      b.link({ href: "https://example.test" }, "a ", b.strong("bold"), " part"),
    ),
  ],
  [
    "[one](https://one.test)[two](https://two.test)",
    b.p(
      b.link({ href: "https://one.test" }, "one"),
      b.link({ href: "https://two.test" }, "two"),
    ),
  ],
  [
    '[one](https://example.test "Title")[two](https://example.test)',
    b.p(
      b.link({ href: "https://example.test", title: "Title" }, "one"),
      b.link({ href: "https://example.test" }, "two"),
    ),
  ],
])("mark spanning several nodes %s", (markdown, block) => {
  const node = b.doc(block) as unknown as ProseMirrorNode;

  expect(pmu.parse(markdown)).toEqualProseMirrorNode(node);
  expect(pmu.serialize(node)).toBe(`${markdown}\n`);
});

test.each([
  ["**`code`**", b.strong(b.code("code"))],
  ["*`code`*", b.em(b.code("code"))],
  [
    "[`code`](https://example.test)",
    b.link({ href: "https://example.test" }, b.code("code")),
  ],
  ["***`code`***", b.strong(b.em(b.code("code")))],
  [
    "[**`code`**](https://example.test)",
    b.link({ href: "https://example.test" }, b.strong(b.code("code"))),
  ],
  ["**a `code` part**", b.strong("a ", b.code("code"), " part")],
])("inline code with other marks %s", (markdown, marked) => {
  const node = b.doc(b.p(marked)) as unknown as ProseMirrorNode;

  expect(pmu.parse(markdown)).toEqualProseMirrorNode(node);
  expect(pmu.serialize(node)).toBe(`${markdown}\n`);
});

test.each([
  [
    "[a][x] and [b][x]\n\n[x]: https://example.test",
    b.p(
      b.link({ href: "https://example.test" }, "a"),
      " and ",
      b.link({ href: "https://example.test" }, "b"),
    ),
    "[a](https://example.test) and [b](https://example.test)\n",
  ],
  [
    "![a][x] ![b][x]\n\n[x]: https://example.test",
    b.p(
      b.img({ alt: "a", src: "https://example.test" }),
      " ",
      b.img({ alt: "b", src: "https://example.test" }),
    ),
    "![a](https://example.test) ![b](https://example.test)\n",
  ],
  [
    "[a][x][b][y]\n\n[x]: https://x.test\n[y]: https://y.test",
    b.p(
      b.link({ href: "https://x.test" }, "a"),
      b.link({ href: "https://y.test" }, "b"),
    ),
    "[a](https://x.test)[b](https://y.test)\n",
  ],
])("references %s", (markdown, block, serialized) => {
  const parsed = pmu.parse(markdown);

  expect(parsed).toEqualProseMirrorNode(
    b.doc(block) as unknown as ProseMirrorNode,
  );
  expect(pmu.serialize(parsed)).toBe(serialized);
});

test.each([
  [
    "<https://example.test>",
    b.p(b.link({ href: "https://example.test" }, "https://example.test")),
    "<https://example.test>\n",
  ],
  [
    "<foo@bar.example.com>",
    b.p(b.link({ href: "mailto:foo@bar.example.com" }, "foo@bar.example.com")),
    "<foo@bar.example.com>\n",
  ],
  [
    "<mailto:foo@bar.example.com>",
    b.p(
      b.link(
        { href: "mailto:foo@bar.example.com" },
        "mailto:foo@bar.example.com",
      ),
    ),
    "<mailto:foo@bar.example.com>\n",
  ],
  [
    "Visit <https://example.test/a?b=c> or <foo@bar.example.com>.",
    b.p(
      "Visit ",
      b.link(
        { href: "https://example.test/a?b=c" },
        "https://example.test/a?b=c",
      ),
      " or ",
      b.link({ href: "mailto:foo@bar.example.com" }, "foo@bar.example.com"),
      ".",
    ),
    "Visit <https://example.test/a?b=c> or <foo@bar.example.com>.\n",
  ],
  [
    "[https://example.test](https://example.test)",
    b.p(b.link({ href: "https://example.test" }, "https://example.test")),
    "<https://example.test>\n",
  ],
  [
    '[https://example.test](https://example.test "Title")',
    b.p(
      b.link(
        { href: "https://example.test", title: "Title" },
        "https://example.test",
      ),
    ),
    '[https://example.test](https://example.test "Title")\n',
  ],
  [
    "[example.test](https://example.test)",
    b.p(b.link({ href: "https://example.test" }, "example.test")),
    "[example.test](https://example.test)\n",
  ],
  [
    "**<https://example.test>**",
    b.p(
      b.link(
        { href: "https://example.test" },
        b.strong("https://example.test"),
      ),
    ),
    "[**https://example.test**](https://example.test)\n",
  ],
  [
    "https://example.test",
    b.p("https://example.test"),
    "https://example.test\n",
  ],
  ["foo@bar.example.com", b.p("foo@bar.example.com"), "foo@bar.example.com\n"],
])("autolink %s", (markdown, block, serialized) => {
  const parsed = pmu.parse(markdown);

  expect(parsed).toEqualProseMirrorNode(
    b.doc(block) as unknown as ProseMirrorNode,
  );
  expect(pmu.serialize(parsed)).toBe(serialized);
  expect(pmu.parse(serialized)).toEqualProseMirrorNode(parsed);
});

test.each([
  ["an unordered", "- a\n- b\n\n  [ref]: /url\n- d\n", "* a\n\n* b\n\n* d\n"],
  ["a last item in a", "- a\n- b\n\n  [ref]: /url\n", "* a\n\n* b\n"],
  [
    "an ordered",
    "1. a\n2. b\n\n   [ref]: /url\n3. d\n",
    "1. a\n\n2. b\n\n3. d\n",
  ],
  [
    "a nested",
    "- a\n  - b\n  - c\n\n    [ref]: /url\n- d\n",
    "* a\n  * b\n\n  * c\n* d\n",
  ],
])("%s list made loose only by a definition", (_, markdown, serialized) => {
  expect(pmu.serialize(pmu.parse(markdown))).toBe(serialized);
});

test.each([
  [
    "unordered",
    b.ul(b.li(b.p("a")), b.li({ spread: true }, b.p("b")), b.li(b.p("c"))),
    "* a\n\n* b\n\n* c\n",
  ],
  [
    "ordered",
    b.ol(b.li(b.p("a")), b.li({ spread: true }, b.p("b")), b.li(b.p("c"))),
    "1. a\n\n2. b\n\n3. c\n",
  ],
])("tight %s list with a spread single-paragraph item", (_, list, markdown) => {
  expect(pmu.serialize(b.doc(list) as unknown as ProseMirrorNode)).toBe(
    markdown,
  );
});

test.each([
  [
    "a nested list followed by a paragraph",
    [b.p("foo"), b.ul(b.li(b.p("bar"))), b.p("baz")],
  ],
  [
    "a blockquote followed by a paragraph",
    [b.p("foo"), b.blockquote(b.p("q")), b.p("bar")],
  ],
  [
    "two blockquotes",
    [b.p("foo"), b.blockquote(b.p("q")), b.blockquote(b.p("r"))],
  ],
  ["a thematic break", [b.p("foo"), b.hr()]],
])("tight list item with %s", (_, content) => {
  const tight = b.doc(b.ul(b.li(...content))) as unknown as ProseMirrorNode;
  const spread = b.doc(
    b.ul(b.li({ spread: true }, ...content)),
  ) as unknown as ProseMirrorNode;

  expect(pmu.parse(pmu.serialize(tight))).toEqualProseMirrorNode(spread);
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
