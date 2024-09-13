import { ProseMirrorUnified } from "prosemirror-unified";

import { MarkdownExtension } from "../src/MarkdownExtension";

test("unist -> ProseMirror conversion", () => {
  const pmu = new ProseMirrorUnified([new MarkdownExtension()]);
  const schema = pmu.schema();
  const result = pmu.parse(
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
  );

  expect(result).toEqualProsemirrorNode(
    schema.nodes["doc"].createAndFill({}, [
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Inside a blockquote"),
        ])!,
      ])!,
      schema.nodes["paragraph"].createAndFill({}, [
        schema.text("Paragraph with a"),
        schema.nodes["hard_break"].createAndFill()!,
        schema.text("hard break"),
      ])!,
      schema.nodes["code_block"].createAndFill({}, [schema.text("Code")])!,
      schema.nodes["heading"].createAndFill({}, [schema.text("Hello")])!,
      schema.nodes["horizontal_rule"].createAndFill()!,
      schema.nodes["paragraph"].createAndFill({}, [
        schema.nodes["image"].createAndFill({
          alt: "Awesome image",
          src: "https://example.test",
        })!,
      ])!,
      schema.nodes["paragraph"].createAndFill({}, [
        schema.nodes["image"].createAndFill({
          alt: "Image 2",
          src: "https://img2.test",
        })!,
      ])!,
      schema.nodes["ordered_list"].createAndFill({}, [
        schema.nodes["regular_list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Ordered list"),
          ])!,
        ])!,
      ])!,
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["regular_list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Unordered list"),
          ])!,
        ])!,
      ])!,
      schema.nodes["paragraph"].createAndFill({}, [
        schema.text("A text with a "),
        schema.text("bold part").mark([schema.marks["strong"].create()]),
        schema.text(", some "),
        schema.text("inline code").mark([schema.marks["code"].create()]),
        schema.text(", a bit "),
        schema.text("that is italic").mark([schema.marks["em"].create()]),
        schema.text(", one "),
        schema
          .text("link")
          .mark([
            schema.marks["link"].create({ href: "https://example.test" }),
          ]),
        schema.text(" and another "),
        schema
          .text("type of link")
          .mark([schema.marks["link"].create({ href: "https://link2.test" })]),
        schema.text("."),
      ])!,
    ])!,
  );
});

test("ProseMirror -> unist conversion", () => {
  const pmu = new ProseMirrorUnified([new MarkdownExtension()]);
  const schema = pmu.schema();
  const result = pmu.serialize(
    schema.nodes["doc"].createAndFill({}, [
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Inside a blockquote"),
        ])!,
      ])!,
      schema.nodes["paragraph"].createAndFill({}, [
        schema.text("Paragraph with a"),
        schema.nodes["hard_break"].createAndFill()!,
        schema.text("hard break"),
      ])!,
      schema.nodes["code_block"].createAndFill({}, [schema.text("Code")])!,
      schema.nodes["heading"].createAndFill({}, [schema.text("Hello")])!,
      schema.nodes["horizontal_rule"].createAndFill()!,
      schema.nodes["paragraph"].createAndFill({}, [
        schema.nodes["image"].createAndFill({
          alt: "Awesome image",
          src: "https://example.test",
        })!,
      ])!,
      schema.nodes["ordered_list"].createAndFill({}, [
        schema.nodes["regular_list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Ordered list"),
          ])!,
        ])!,
      ])!,
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["regular_list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Unordered list"),
          ])!,
        ])!,
      ])!,
      schema.nodes["paragraph"].createAndFill({}, [
        schema.text("A text with a "),
        schema.text("bold part").mark([schema.marks["strong"].create()]),
        schema.text(", some "),
        schema.text("inline code").mark([schema.marks["code"].create()]),
        schema.text(", a bit "),
        schema.text("that is italic").mark([schema.marks["em"].create()]),
        schema.text(", one "),
        schema
          .text("link")
          .mark([
            schema.marks["link"].create({ href: "https://example.test" }),
          ]),
        schema.text("."),
      ])!,
    ])!,
  );

  expect(result).toBe(
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
