import { RootExtension } from "../../src/syntax-extensions/RootExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new RootExtension(), {
  proseMirrorNodeName: "doc",
  unistNodeName: "root",
})
  .shouldMatchUnistNode({ type: "root", children: [] })
  .shouldMatchUnistNode({
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Hello World!" }],
      },
    ],
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "root", children: [] }, (schema) => [
    schema.nodes["doc"].createAndFill()!,
  ])
  .shouldConvertUnistNode(
    {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Hello World!" }],
        },
      ],
    },
    (schema) => [
      schema.nodes["doc"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
  )
  .shouldMatchProseMirrorNode((schema) => schema.nodes["doc"].createAndFill()!)
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes["doc"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["doc"].createAndFill()!,
    [{ type: "root", children: [{ type: "paragraph", children: [] }] }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["doc"].createAndFill({}, [
        schema.nodes["paragraph"].createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    [
      {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Hello World!" }],
          },
        ],
      },
    ],
  )
  .test();
