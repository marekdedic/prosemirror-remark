import { ParagraphExtension } from "../../src/syntax-extensions/ParagraphExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new ParagraphExtension(), {
  proseMirrorNodeName: "paragraph",
  unistNodeName: "paragraph",
})
  .shouldMatchUnistNode({ children: [], type: "paragraph" })
  .shouldMatchUnistNode({
    children: [{ type: "text", value: "Hello World!" }],
    type: "paragraph",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ children: [], type: "paragraph" }, (schema) => [
    schema.nodes["paragraph"].create(),
  ])
  .shouldConvertUnistNode(
    { children: [{ type: "text", value: "Hello World!" }], type: "paragraph" },
    (schema) => [
      schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
    ],
  )
  .shouldMatchProseMirrorNode((schema) => schema.nodes["paragraph"].create())
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["paragraph"].create(),
    [{ children: [], type: "paragraph" }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
    [
      {
        children: [{ type: "text", value: "Hello World!" }],
        type: "paragraph",
      },
    ],
  )
  .test();
