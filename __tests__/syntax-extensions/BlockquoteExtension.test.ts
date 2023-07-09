import { BlockquoteExtension } from "../../src/syntax-extensions/BlockquoteExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new BlockquoteExtension(), {
  proseMirrorNodeName: "blockquote",
  unistNodeName: "blockquote",
})
  .shouldMatchUnistNode({ type: "blockquote", children: [] })
  .shouldMatchUnistNode({
    type: "blockquote",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Hello World!" }],
      },
    ],
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "blockquote",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Hello World!" }],
        },
      ],
    },
    (schema) => [
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "blockquote",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Hello World!" }],
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "Second paragraph" }],
        },
      ],
    },
    (schema) => [
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Second paragraph"),
        ])!,
      ])!,
    ]
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["blockquote"].createAndFill()!
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    [
      {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Hello World!" }],
          },
        ],
      },
    ]
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Second paragraph"),
        ])!,
      ])!,
    [
      {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Hello World!" }],
          },
          {
            type: "paragraph",
            children: [{ type: "text", value: "Second paragraph" }],
          },
        ],
      },
    ]
  )
  .shouldMatchInputRule(
    "> Hello World!",
    (schema) => [
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
    "> Hello World!"
  )
  .shouldMatchInputRule(
    " > Hello World!",
    (schema) => [
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
    "> Hello World!"
  )
  .shouldMatchInputRule(
    "  > Hello World!",
    (schema) => [
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
    "> Hello World!"
  )
  .shouldMatchInputRule(
    "   > Hello World!",
    (schema) => [
      schema.nodes["blockquote"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
    "> Hello World!"
  )
  .test();
