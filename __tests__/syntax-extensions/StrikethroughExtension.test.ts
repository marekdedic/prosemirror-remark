import type { Node as UnistNode } from "unist";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { StrikethroughExtension } from "../../src/syntax-extensions/StrikethroughExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new StrikethroughExtension(), {
  proseMirrorMarkName: "strikethrough",
  unistNodeName: "delete",
  otherExtensionsInTest: [new BoldExtension(), new ItalicExtension()],
})
  .shouldMatchUnistNode({ type: "delete", children: [] })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "delete",
      children: [{ type: "text", value: "Hello World!" }],
    },
    (schema) => [
      schema.text("Hello World!").mark([schema.marks.strikethrough.create()]),
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "delete",
      children: [
        {
          type: "emphasis",
          children: [{ type: "text", value: "Hello World!" }],
        },
      ],
    },
    (schema) => [
      schema
        .text("Hello World!")
        .mark([schema.marks.em.create(), schema.marks.strikethrough.create()]),
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "emphasis",
      children: [
        {
          type: "delete",
          children: [{ type: "text", value: "Hello World!" }],
        },
      ],
    } as UnistNode,
    (schema) => [
      schema
        .text("Hello World!")
        .mark([schema.marks.strikethrough.create(), schema.marks.em.create()]),
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "delete",
      children: [
        {
          type: "strong",
          children: [{ type: "text", value: "Hello World!" }],
        },
      ],
    },
    (schema) => [
      schema
        .text("Hello World!")
        .mark([
          schema.marks.strong.create(),
          schema.marks.strikethrough.create(),
        ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "strong",
      children: [
        {
          type: "delete",
          children: [{ type: "text", value: "Hello World!" }],
        },
      ],
    } as UnistNode,
    (schema) => [
      schema
        .text("Hello World!")
        .mark([
          schema.marks.strikethrough.create(),
          schema.marks.strong.create(),
        ]),
    ],
  )
  .shouldMatchProseMirrorMark((schema) => schema.mark("strikethrough"))
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.text("Hello World!").mark([schema.mark("strikethrough")]),
    [{ type: "delete", children: [{ type: "text", value: "Hello World!" }] }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Hello World!")
        .mark([schema.mark("em"), schema.mark("strikethrough")]),
    [
      {
        type: "delete",
        children: [
          {
            type: "emphasis",
            children: [{ type: "text", value: "Hello World!" }],
          },
        ],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Hello World!")
        .mark([schema.mark("strikethrough"), schema.mark("em")]),
    [
      {
        type: "emphasis",
        children: [
          {
            type: "delete",
            children: [{ type: "text", value: "Hello World!" }],
          },
        ],
      } as UnistNode,
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Hello World!")
        .mark([schema.mark("strong"), schema.mark("strikethrough")]),
    [
      {
        type: "delete",
        children: [
          {
            type: "strong",
            children: [{ type: "text", value: "Hello World!" }],
          },
        ],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Hello World!")
        .mark([schema.mark("strikethrough"), schema.mark("strong")]),
    [
      {
        type: "strong",
        children: [
          {
            type: "delete",
            children: [{ type: "text", value: "Hello World!" }],
          },
        ],
      } as UnistNode,
    ],
  )
  .shouldMatchInputRule("~Test~", "~~Test~~", "Test")
  .shouldMatchInputRule("~~Test~~", "~~Test~~", "Test")
  .shouldMatchInputRule("~Hello World~", "~~Hello World~~", "Hello World")
  .shouldMatchInputRule("~Test~\n", "~~Test~~\n", (schema) => [
    schema.text("Test").mark([schema.mark("strikethrough")]),
    schema.text("\n"),
  ])
  .shouldMatchInputRule("~~Test~~\n", "~~Test~~\n", (schema) => [
    schema.text("Test").mark([schema.mark("strikethrough")]),
    schema.text("\n"),
  ])
  .shouldMatchInputRule("~ ~Test~", "\\~ ~~Test~~", (schema) => [
    schema.text("~ "),
    schema.text("Test").mark([schema.mark("strikethrough")]),
  ])
  .shouldMatchInputRule("~Test~ ~", "~~Test~~ \\~", (schema) => [
    schema.text("Test").mark([schema.mark("strikethrough")]),
    schema.text(" ~"),
  ])
  .test();
