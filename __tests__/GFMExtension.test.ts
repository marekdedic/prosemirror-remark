import { ProseMirrorUnified } from "prosemirror-unified";

import { GFMExtension } from "../src/GFMExtension";

test("unist -> ProseMirror conversion", () => {
  const pmu = new ProseMirrorUnified([new GFMExtension()]);
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
      "- [ ] Task list\n" +
      "\n" +
      "A text with a **bold part**, some `inline code`, a bit *that is italic*, one that is ~striked through~, one [link](https://example.test), one simple link to www.github.com and another [type of link][link2].\n" +
      "\n" +
      "[link2]: https://link2.test",
  );

  expect(result).toEqualProsemirrorNode(
    schema.nodes["doc"].create({}, [
      schema.nodes["blockquote"].create({}, [
        schema.nodes["paragraph"].create({}, [
          schema.text("Inside a blockquote"),
        ]),
      ]),
      schema.nodes["paragraph"].create({}, [
        schema.text("Paragraph with a"),
        schema.nodes["hard_break"].create(),
        schema.text("hard break"),
      ]),
      schema.nodes["code_block"].create({}, [schema.text("Code")]),
      schema.nodes["heading"].create({}, [schema.text("Hello")]),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create({}, [
        schema.nodes["image"].create({
          alt: "Awesome image",
          src: "https://example.test",
        }),
      ]),
      schema.nodes["paragraph"].create({}, [
        schema.nodes["image"].create({
          alt: "Image 2",
          src: "https://img2.test",
        }),
      ]),
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Ordered list")]),
        ]),
      ]),
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Unordered list")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Task list")]),
        ]),
      ]),
      schema.nodes["paragraph"].create({}, [
        schema.text("A text with a "),
        schema.text("bold part").mark([schema.marks["strong"].create()]),
        schema.text(", some "),
        schema.text("inline code").mark([schema.marks["code"].create()]),
        schema.text(", a bit "),
        schema.text("that is italic").mark([schema.marks["em"].create()]),
        schema.text(", one that is "),
        schema
          .text("striked through")
          .mark([schema.marks["strikethrough"].create()]),
        schema.text(", one "),
        schema
          .text("link")
          .mark([
            schema.marks["link"].create({ href: "https://example.test" }),
          ]),
        schema.text(", one simple link to "),
        schema
          .text("www.github.com")
          .mark([
            schema.marks["link"].create({ href: "http://www.github.com" }),
          ]),
        schema.text(" and another "),
        schema
          .text("type of link")
          .mark([schema.marks["link"].create({ href: "https://link2.test" })]),
        schema.text("."),
      ]),
    ]),
  );
});

test("ProseMirror -> unist conversion", () => {
  const pmu = new ProseMirrorUnified([new GFMExtension()]);
  const schema = pmu.schema();
  const result = pmu.serialize(
    schema.nodes["doc"].create({}, [
      schema.nodes["blockquote"].create({}, [
        schema.nodes["paragraph"].create({}, [
          schema.text("Inside a blockquote"),
        ]),
      ]),
      schema.nodes["paragraph"].create({}, [
        schema.text("Paragraph with a"),
        schema.nodes["hard_break"].create(),
        schema.text("hard break"),
      ]),
      schema.nodes["code_block"].create({}, [schema.text("Code")]),
      schema.nodes["heading"].create({}, [schema.text("Hello")]),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create({}, [
        schema.nodes["image"].create({
          alt: "Awesome image",
          src: "https://example.test",
        }),
      ]),
      schema.nodes["paragraph"].create({}, [
        schema.nodes["image"].create({
          alt: "Image 2",
          src: "https://img2.test",
        }),
      ]),
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Ordered list")]),
        ]),
      ]),
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Unordered list")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Task list")]),
        ]),
      ]),
      schema.nodes["paragraph"].create({}, [
        schema.text("A text with a "),
        schema.text("bold part").mark([schema.marks["strong"].create()]),
        schema.text(", some "),
        schema.text("inline code").mark([schema.marks["code"].create()]),
        schema.text(", a bit "),
        schema.text("that is italic").mark([schema.marks["em"].create()]),
        schema.text(", one that is "),
        schema
          .text("striked through")
          .mark([schema.marks["strikethrough"].create()]),
        schema.text(", one "),
        schema
          .text("link")
          .mark([
            schema.marks["link"].create({ href: "https://example.test" }),
          ]),
        schema.text(", one simple link to "),
        schema
          .text("www.github.com")
          .mark([
            schema.marks["link"].create({ href: "http://www.github.com" }),
          ]),
        schema.text(" and another "),
        schema
          .text("type of link")
          .mark([schema.marks["link"].create({ href: "https://link2.test" })]),
        schema.text("."),
      ]),
    ]),
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
