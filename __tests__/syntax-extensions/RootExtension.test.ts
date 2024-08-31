import { RootExtension } from "../../src/syntax-extensions/RootExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new RootExtension(), {
  proseMirrorNodeName: "doc",
  unistNodeName: "root",
})
  .shouldMatchUnistNode({ children: [], type: "root" })
  .shouldMatchUnistNode({
    children: [
      {
        children: [{ type: "text", value: "Hello World!" }],
        type: "paragraph",
      },
    ],
    type: "root",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ children: [], type: "root" }, (schema) => [
    schema.nodes.doc.createAndFill()!,
  ])
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "paragraph",
        },
      ],
      type: "root",
    },
    (schema) => [
      schema.nodes.doc.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
    ],
  )
  .shouldMatchProseMirrorNode((schema) => schema.nodes.doc.createAndFill()!)
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.doc.createAndFill({}, [
        schema.nodes.paragraph.createAndFill({}, [
          schema.text("Hello World!"),
        ])!,
      ])!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.doc.createAndFill()!,
    [{ children: [{ children: [], type: "paragraph" }], type: "root" }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.doc.createAndFill({}, [
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
        type: "root",
      },
    ],
  )
  .test();
