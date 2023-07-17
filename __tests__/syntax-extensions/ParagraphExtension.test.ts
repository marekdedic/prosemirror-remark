import { ParagraphExtension } from "../../src/syntax-extensions/ParagraphExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new ParagraphExtension(), {
  proseMirrorNodeName: "paragraph",
  unistNodeName: "paragraph",
})
  .shouldMatchUnistNode({ type: "paragraph", children: [] })
  .shouldMatchUnistNode({
    type: "paragraph",
    children: [{ type: "text", value: "Hello World!" }],
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "paragraph", children: [] }, (schema) => [
    schema.nodes.paragraph.createAndFill()!,
  ])
  .shouldConvertUnistNode(
    { type: "paragraph", children: [{ type: "text", value: "Hello World!" }] },
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("Hello World!")])!,
    ],
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.paragraph.createAndFill()!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.paragraph.createAndFill({}, [schema.text("Hello World!")])!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.paragraph.createAndFill()!,
    [{ type: "paragraph", children: [] }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.paragraph.createAndFill({}, [schema.text("Hello World!")])!,
    [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Hello World!" }],
      },
    ],
  )
  .test();
