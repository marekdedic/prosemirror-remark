import type { Node as UnistNode } from "unist";

import { OrderedListExtension } from "../../src/syntax-extensions/OrderedListExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new OrderedListExtension(), {
  proseMirrorNodeName: "ordered_list",
  unistNodeName: "list",
})
  .shouldMatchUnistNode({ children: [], ordered: true, type: "list" })
  .shouldMatchUnistNode({
    children: [],
    ordered: true,
    spread: true,
    type: "list",
  })
  .shouldMatchUnistNode({
    children: [],
    ordered: true,
    spread: true,
    start: 1,
    type: "list",
  })
  .shouldMatchUnistNode({
    children: [],
    ordered: true,
    spread: true,
    start: 42,
    type: "list",
  })
  .shouldNotMatchUnistNode({
    children: [],
    ordered: false,
    type: "list",
  } as UnistNode)
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: true,
      type: "list",
    },
    (b) => [b.ol(b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: true,
      spread: true,
      type: "list",
    },
    (b) => [b.ol({ spread: true }, b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: true,
      spread: true,
      start: 42,
      type: "list",
    },
    (b) => [b.ol({ spread: true, start: 42 }, b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], type: "listItem" }],
      ordered: true,
      type: "list",
    },
    (b) => [b.ol(b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], spread: true, type: "listItem" }],
      ordered: true,
      type: "list",
    },
    (b) => [b.ol(b.li({ spread: true }, b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "paragraph",
            },
          ],
          type: "listItem",
        },
      ],
      ordered: true,
      type: "list",
    },
    (b) => [b.ol(b.li(b.p("Hello World!")))],
  )
  .shouldMatchProseMirrorNode((b) => b.ol())
  .shouldMatchProseMirrorNode((b) => b.ol({ spread: true }))
  .shouldMatchProseMirrorNode((b) => b.ol({ spread: true, start: 42 }))
  .shouldMatchProseMirrorNode((b) => b.ol(b.li()))
  .shouldMatchProseMirrorNode((b) => b.ol(b.li({ spread: true })))
  .shouldMatchProseMirrorNode((b) => b.ol(b.li(b.p("Hello World!"))))
  .shouldConvertProseMirrorNode(
    (b) => b.ol(b.li(b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: false,
            type: "listItem",
          },
        ],
        ordered: true,
        spread: false,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ol({ spread: true }, b.li(b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: true,
            type: "listItem",
          },
        ],
        ordered: true,
        spread: true,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ol({ spread: true, start: 42 }, b.li(b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: true,
            type: "listItem",
          },
        ],
        ordered: true,
        spread: true,
        start: 42,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ol(b.li(b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: false,
            type: "listItem",
          },
        ],
        ordered: true,
        spread: false,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ol({ spread: true }, b.li({ spread: true }, b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: true,
            type: "listItem",
          },
        ],
        ordered: true,
        spread: true,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ol(b.li(b.p("Hello World!"))),
    [
      {
        children: [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "paragraph",
              },
            ],
            spread: false,
            type: "listItem",
          },
        ],
        ordered: true,
        spread: false,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldMatchInputRule("1. ", (b) => [b.ol(b.li(b.p()))], "1.")
  .shouldMatchInputRule(
    "1. Hello World!",
    (b) => [b.ol(b.li(b.p("Hello World!")))],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    " 1. Hello World!",
    (b) => [b.ol(b.li(b.p("Hello World!")))],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "  1. Hello World!",
    (b) => [b.ol(b.li(b.p("Hello World!")))],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "   1. Hello World!",
    (b) => [b.ol(b.li(b.p("Hello World!")))],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "42. Hello World!",
    (b) => [b.ol({ start: 42 }, b.li(b.p("Hello World!")))],
    "42. Hello World!",
  )
  .shouldMatchInputRule(
    "1. Hello World!{Enter}Second item",
    (b) => [b.ol(b.li(b.p("Hello World!")), b.li(b.p("Second item")))],
    "1. Hello World!\n2. Second item",
  )
  .shouldSupportKeymap(
    (b) => [b.p("Hello")],
    3,
    "{Mod-Shift-9}",
    (b) => [b.ol(b.li(b.p("Hello")))],
    "1. Hello",
  )
  .shouldSupportKeymap(
    (b) => [b.ol(b.li(b.p("Hello")))],
    6,
    "{Enter}",
    (b) => [b.ol(b.li(b.p("Hel")), b.li(b.p("lo")))],
    "1. Hel\n2. lo",
  )
  .shouldSupportKeymap(
    (b) => [b.ol(b.li(b.p("Hello")), b.li(b.p("World")))],
    10,
    "{Tab}",
    (b) => [b.ol(b.li(b.p("Hello"), b.ol(b.li(b.p("World")))))],
    "1. Hello\n   1. World",
  )
  .shouldSupportKeymap(
    (b) => [b.ol(b.li(b.p("Hello"), b.ol(b.li(b.p("World")))))],
    10,
    "{Shift-Tab}",
    (b) => [b.ol(b.li(b.p("Hello")), b.li(b.p("World")))],
    "1. Hello\n2. World",
  )
  .shouldParseDOM("<ol><li><p>Hello</p></li></ol>", (b) => [
    b.ol({ start: 1 }, b.li(b.p("Hello"))),
  ])
  .shouldParseDOM('<ol start="5"><li><p>Hello</p></li></ol>', (b) => [
    b.ol({ start: 5 }, b.li(b.p("Hello"))),
  ])
  .shouldParseDOM('<ol data-spread="true"><li><p>Hello</p></li></ol>', (b) => [
    b.ol({ spread: true, start: 1 }, b.li(b.p("Hello"))),
  ])
  .shouldRenderDOM(
    (b) => [b.ol({ start: 5 }, b.li(b.p("Hello")))],
    '<ol data-spread="false" start="5"><li><p>Hello</p></li></ol>',
  )
  // A number continuing the preceding list joins it; any other number starts a
  // New list.
  .shouldMatchInputRule(
    "1. a{Enter}{Enter}2. b",
    (b) => [b.ol(b.li(b.p("a")), b.li(b.p("b")))],
    "1. a\n2. b",
  )
  .shouldMatchInputRule(
    "1. a{Enter}{Enter}7. b",
    (b) => [b.ol(b.li(b.p("a"))), b.ol({ start: 7 }, b.li(b.p("b")))],
    "1. a\n\n7) b",
  )
  .shouldMatchInputRule(
    "5. a{Enter}{Enter}6. b",
    (b) => [b.ol({ start: 5 }, b.li(b.p("a")), b.li(b.p("b")))],
    "5. a\n6. b",
  )
  .shouldMatchInputRule(
    "1. a{Enter}b{Enter}{Enter}3. c",
    (b) => [b.ol(b.li(b.p("a")), b.li(b.p("b")), b.li(b.p("c")))],
    "1. a\n2. b\n3. c",
  )
  .test();
