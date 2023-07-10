import { TextExtension } from "../../src/syntax-extensions/TextExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new TextExtension(), {
  proseMirrorNodeName: "text",
  unistNodeName: "text",
})
  .shouldMatchUnistNode({ type: "text", value: "Hello World!" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "text", value: "Hello World!" }, (schema) => [
    schema.text("Hello World!"),
  ])
  .shouldMatchProseMirrorNode((schema) => schema.text("Hello World"))
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!"),
    [{ type: "text", value: "Hello World!" }]
  )
  .test();
