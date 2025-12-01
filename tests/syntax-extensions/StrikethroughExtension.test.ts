import type { Node as UnistNode } from "unist";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { StrikethroughExtension } from "../../src/syntax-extensions/StrikethroughExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new StrikethroughExtension(), {
  otherExtensionsInTest: [new BoldExtension(), new ItalicExtension()],
  proseMirrorMarkName: "strikethrough",
  unistNodeName: "delete",
})
  .shouldMatchUnistNode({ children: [], type: "delete" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      type: "delete",
    },
    (schema) => [
      schema
        .text("Hello World!")
        .mark([schema.marks["strikethrough"].create()]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "emphasis",
        },
      ],
      type: "delete",
    },
    (schema) => [
      schema
        .text("Hello World!")
        .mark([
          schema.marks["em"].create(),
          schema.marks["strikethrough"].create(),
        ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "delete",
        },
      ],
      type: "emphasis",
    },
    (schema) => [
      schema
        .text("Hello World!")
        .mark([
          schema.marks["strikethrough"].create(),
          schema.marks["em"].create(),
        ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "strong",
        },
      ],
      type: "delete",
    },
    (schema) => [
      schema
        .text("Hello World!")
        .mark([
          schema.marks["strong"].create(),
          schema.marks["strikethrough"].create(),
        ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "delete",
        },
      ],
      type: "strong",
    } as UnistNode,
    (schema) => [
      schema
        .text("Hello World!")
        .mark([
          schema.marks["strikethrough"].create(),
          schema.marks["strong"].create(),
        ]),
    ],
  )
  .shouldMatchProseMirrorMark((schema) => schema.mark("strikethrough"))
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.text("Hello World!").mark([schema.mark("strikethrough")]),
    [{ children: [{ type: "text", value: "Hello World!" }], type: "delete" }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Hello World!")
        .mark([schema.mark("em"), schema.mark("strikethrough")]),
    [
      {
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "emphasis",
          },
        ],
        type: "delete",
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
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "delete",
          },
        ],
        type: "emphasis",
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
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "strong",
          },
        ],
        type: "delete",
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
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "delete",
          },
        ],
        type: "strong",
      } as UnistNode,
    ],
  )
  .shouldMatchInputRule("~Test~", "~~Test~~", "Test")
  .shouldMatchInputRule("~~Test~~", "~~Test~~", "Test")
  .shouldMatchInputRule("~Hello World~", "~~Hello World~~", "Hello World")
  .shouldMatchInputRule("~Test~{Enter}", "~~Test~~\n\n", (schema) => [
    schema.nodes["paragraph"].create({}, [
      schema.text("Test").mark([schema.mark("strikethrough")]),
    ]),
    schema.nodes["paragraph"].create(),
  ])
  .shouldMatchInputRule("~~Test~~{Enter}", "~~Test~~\n\n", (schema) => [
    schema.nodes["paragraph"].create({}, [
      schema.text("Test").mark([schema.mark("strikethrough")]),
    ]),
    schema.nodes["paragraph"].create(),
  ])
  .shouldMatchInputRule("~ ~Test~", "\\~ ~~Test~~", (schema) => [
    schema.nodes["paragraph"].create({}, [
      schema.text("~ "),
      schema.text("Test").mark([schema.mark("strikethrough")]),
    ]),
  ])
  .shouldMatchInputRule("~Test~ ~", "~~Test~~ \\~", (schema) => [
    schema.nodes["paragraph"].create({}, [
      schema.text("Test").mark([schema.mark("strikethrough")]),
      schema.text(" ~"),
    ]),
  ])
  .test();
