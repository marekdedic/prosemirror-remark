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
    (schema) => [
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
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
    (schema) => [
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Second paragraph"),
        ])!,
      ])!,
    ],
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.blockquote.createAndFill()!,
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
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
    (schema) =>
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Second paragraph"),
        ])!,
      ])!,
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
    () => [],
    "start",
    "Mod->",
    (schema) => [schema.nodes.blockquote.createAndFill()!],
    ">",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("abcd")])!,
    ],
    3,
    "Mod->",
    (schema) => [
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [schema.text("abcd")])!,
      ])!,
    ],
    "> abcd",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("abcd")])!,
    ],
    { from: 1, to: 3 },
    "Mod->",
    (schema) => [
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [schema.text("abcd")])!,
      ])!,
    ],
    "> abcd",
  )
  .shouldMatchInputRule(
    "> Hello World!",
    (schema) => [
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
    "> Hello World!",
  )
  .shouldMatchInputRule(
    " > Hello World!",
    (schema) => [
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
    "> Hello World!",
  )
  .shouldMatchInputRule(
    "  > Hello World!",
    (schema) => [
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
    "> Hello World!",
  )
  .shouldMatchInputRule(
    "   > Hello World!",
    (schema) => [
      schema.nodes.blockquote.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
    "> Hello World!",
  )
  .test();
