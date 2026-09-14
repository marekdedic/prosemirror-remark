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
  .shouldSupportKeymap(
    (b) => [b.p()],
    "start",
    "{Mod->}",
    (b) => [b.blockquote(b.p())],
    ">",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcd")],
    3,
    "{Mod->}",
    (b) => [b.blockquote(b.p("abcd"))],
    "> abcd",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcd")],
    { anchor: 1, head: 3 },
    "{Mod->}",
    (b) => [b.blockquote(b.p("abcd"))],
    "> abcd",
  )
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
