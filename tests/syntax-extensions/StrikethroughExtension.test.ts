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
    (b) => [b.strikethrough("Hello World!")],
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
    (b) => [b.strikethrough(b.em("Hello World!"))],
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
    (b) => [
      b.schema
        .text("Hello World!")
        .mark([b.schema.mark("strikethrough"), b.schema.mark("em")]),
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
    (b) => [b.strikethrough(b.strong("Hello World!"))],
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
    (b) => [
      b.schema
        .text("Hello World!")
        .mark([b.schema.mark("strikethrough"), b.schema.mark("strong")]),
    ],
  )
  .shouldMatchProseMirrorMark((b) => b.schema.mark("strikethrough"))
  .shouldConvertProseMirrorNode(
    (b) => b.strikethrough("Hello World!"),
    [{ children: [{ type: "text", value: "Hello World!" }], type: "delete" }],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.strikethrough(b.em("Hello World!")),
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
    (b) =>
      b.schema
        .text("Hello World!")
        .mark([b.schema.mark("strikethrough"), b.schema.mark("em")]),
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
    (b) => b.strikethrough(b.strong("Hello World!")),
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
    (b) =>
      b.schema
        .text("Hello World!")
        .mark([b.schema.mark("strikethrough"), b.schema.mark("strong")]),
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
  .shouldMatchInputRule("~Test~{Enter}", "~~Test~~\n\n", (b) => [
    b.p(b.strikethrough("Test")),
    b.p(),
  ])
  .shouldMatchInputRule("~~Test~~{Enter}", "~~Test~~\n\n", (b) => [
    b.p(b.strikethrough("Test")),
    b.p(),
  ])
  .shouldMatchInputRule("~ ~Test~", "\\~ ~~Test~~", (b) => [
    b.p("~ ", b.strikethrough("Test")),
  ])
  .shouldMatchInputRule("~Test~ ~", "~~Test~~ \\~", (b) => [
    b.p(b.strikethrough("Test"), " ~"),
  ])
  .shouldParseDOM("<p><s>Hello</s></p>", (b) => [b.p(b.strikethrough("Hello"))])
  .shouldParseDOM("<p><del>Hello</del></p>", (b) => [
    b.p(b.strikethrough("Hello")),
  ])
  .shouldParseDOM(
    '<p><span style="text-decoration: line-through">Hello</span></p>',
    (b) => [b.p(b.strikethrough("Hello"))],
  )
  .shouldParseDOM(
    '<p><span style="text-decoration: underline line-through">Hello</span></p>',
    (b) => [b.p(b.strikethrough("Hello"))],
  )
  .shouldParseDOM(
    '<p><span style="text-decoration: underline">Hello</span></p>',
    (b) => [b.p("Hello")],
  )
  .shouldRenderDOM(
    (b) => [b.p(b.strikethrough("Hello"))],
    "<p><s>Hello</s></p>",
  )
  .test();
