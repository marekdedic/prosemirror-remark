import { BlockquoteExtension } from "../../src/syntax-extensions/BlockquoteExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new BlockquoteExtension(), {
  proseMirrorNodeName: "blockquote",
  unistNodeName: "blockquote",
})
  .shouldMatchUnistNode({ children: [], type: "blockquote" })
  .shouldMatchUnistNode({
    children: [
      {
        children: [{ type: "text", value: "Hello World!" }],
        type: "paragraph",
      },
    ],
    type: "blockquote",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "paragraph",
        },
      ],
      type: "blockquote",
    },
    (b) => [b.blockquote(b.p("Hello World!"))],
  )
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "paragraph",
        },
        {
          children: [{ type: "text", value: "Second paragraph" }],
          type: "paragraph",
        },
      ],
      type: "blockquote",
    },
    (b) => [b.blockquote(b.p("Hello World!"), b.p("Second paragraph"))],
  )
  .shouldMatchProseMirrorNode((b) => b.blockquote())
  .shouldConvertProseMirrorNode(
    (b) => b.blockquote(b.p("Hello World!")),
    [
      {
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "paragraph",
          },
        ],
        type: "blockquote",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.blockquote(b.p("Hello World!"), b.p("Second paragraph")),
    [
      {
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "paragraph",
          },
          {
            children: [{ type: "text", value: "Second paragraph" }],
            type: "paragraph",
          },
        ],
        type: "blockquote",
      },
    ],
  )
  /* The `Mod->` keymap cannot be expressed via vitest-prosemirror v0.4's
  insertText key-chord syntax: its tokenizer rejects any chord ending in `>`
  ("Unsupported keyboard input").
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create()],
    "start",
    "{Mod->}",
    (schema) => [
      schema.nodes["blockquote"].create({}, [
        schema.nodes["paragraph"].create(),
      ]),
    ],
    ">",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcd")])],
    3,
    "{Mod->}",
    (schema) => [
      schema.nodes["blockquote"].create({}, [
        schema.nodes["paragraph"].create({}, [schema.text("abcd")]),
      ]),
    ],
    "> abcd",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcd")])],
    { anchor: 1, head: 3 },
    "{Mod->}",
    (schema) => [
      schema.nodes["blockquote"].create({}, [
        schema.nodes["paragraph"].create({}, [schema.text("abcd")]),
      ]),
    ],
    "> abcd",
  )
  */
  .shouldMatchInputRule(
    "> Hello World!",
    (b) => [b.blockquote(b.p("Hello World!"))],
    "> Hello World!",
  )
  .shouldMatchInputRule(
    " > Hello World!",
    (b) => [b.blockquote(b.p("Hello World!"))],
    "> Hello World!",
  )
  .shouldMatchInputRule(
    "  > Hello World!",
    (b) => [b.blockquote(b.p("Hello World!"))],
    "> Hello World!",
  )
  .shouldMatchInputRule(
    "   > Hello World!",
    (b) => [b.blockquote(b.p("Hello World!"))],
    "> Hello World!",
  )
  .shouldParseDOM("<blockquote><p>Hello</p></blockquote>", (b) => [
    b.blockquote(b.p("Hello")),
  ])
  .shouldRenderDOM(
    (b) => [b.blockquote(b.p("Hello"))],
    "<blockquote><p>Hello</p></blockquote>",
  )
  .test();
