import type { Node as UnistNode } from "unist";

import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new UnorderedListExtension(), {
  proseMirrorNodeName: "bullet_list",
  unistNodeName: "list",
})
  .shouldMatchUnistNode({ children: [], ordered: false, type: "list" })
  .shouldMatchUnistNode({
    children: [],
    ordered: false,
    spread: true,
    type: "list",
  })
  .shouldMatchUnistNode({
    children: [],
    ordered: false,
    spread: true,
    type: "list",
  })
  .shouldNotMatchUnistNode({
    children: [],
    ordered: true,
    type: "list",
  } as UnistNode)
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: false,
      type: "list",
    },
    (b) => [b.ul(b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: false,
      spread: true,
      type: "list",
    },
    (b) => [b.ul({ spread: true }, b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (b) => [b.ul(b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], spread: true, type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (b) => [b.ul(b.li({ spread: true }, b.p()))],
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
      ordered: false,
      type: "list",
    },
    (b) => [b.ul(b.li(b.p("Hello World!")))],
  )
  .shouldMatchProseMirrorNode((b) => b.ul())
  .shouldMatchProseMirrorNode((b) => b.ul({ spread: true }))
  .shouldMatchProseMirrorNode((b) => b.ul(b.li()))
  .shouldMatchProseMirrorNode((b) => b.ul(b.li({ spread: true })))
  .shouldMatchProseMirrorNode((b) => b.ul(b.li(b.p("Hello World!"))))
  .shouldConvertProseMirrorNode(
    (b) => b.ul(b.li(b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: false,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: false,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ul({ spread: true }, b.li(b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: true,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: true,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ul(b.li(b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: false,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: false,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ul({ spread: true }, b.li({ spread: true }, b.p())),
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: true,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: true,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ul(b.li(b.p("Hello World!"))),
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
        ordered: false,
        spread: false,
        type: "list",
      },
    ],
  )
  .shouldMatchInputRule("* ", (b) => [b.ul(b.li(b.p()))], "*")
  .shouldMatchInputRule(
    "* Hello World!",
    (b) => [b.ul(b.li(b.p("Hello World!")))],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "- Hello World!",
    (b) => [b.ul(b.li(b.p("Hello World!")))],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "+ Hello World!",
    (b) => [b.ul(b.li(b.p("Hello World!")))],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    " * Hello World!",
    (b) => [b.ul(b.li(b.p("Hello World!")))],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "  * Hello World!",
    (b) => [b.ul(b.li(b.p("Hello World!")))],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    " * Hello World!",
    (b) => [b.ul(b.li(b.p("Hello World!")))],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "* Hello World!{Enter}Second item",
    (b) => [b.ul(b.li(b.p("Hello World!")), b.li(b.p("Second item")))],
    "* Hello World!\n* Second item",
  )
  .shouldSupportKeymap(
    (b) => [b.p("Hello")],
    3,
    "{Mod-Shift-8}",
    (b) => [b.ul(b.li(b.p("Hello")))],
    "* Hello",
  )
  .shouldSupportKeymap(
    (b) => [b.ul(b.li(b.p("Hello")))],
    6,
    "{Enter}",
    (b) => [b.ul(b.li(b.p("Hel")), b.li(b.p("lo")))],
    "* Hel\n* lo",
  )
  .shouldSupportKeymap(
    (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("World")))],
    10,
    "{Tab}",
    (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("World")))))],
    "* Hello\n  * World",
  )
  .shouldSupportKeymap(
    (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("World")))))],
    10,
    "{Shift-Tab}",
    (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("World")))],
    "* Hello\n* World",
  )
  .shouldParseDOM("<ul><li><p>Hello</p></li></ul>", (b) => [
    b.ul(b.li(b.p("Hello"))),
  ])
  .shouldParseDOM('<ul data-spread="true"><li><p>Hello</p></li></ul>', (b) => [
    b.ul({ spread: true }, b.li(b.p("Hello"))),
  ])
  .shouldRenderDOM(
    (b) => [b.ul(b.li(b.p("Hello")))],
    '<ul data-spread="false"><li><p>Hello</p></li></ul>',
  )
  .test();
