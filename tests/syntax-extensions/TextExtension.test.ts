import { TextExtension } from "../../src/syntax-extensions/TextExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new TextExtension(), {
  proseMirrorNodeName: "text",
  unistNodeName: "text",
})
  .shouldMatchUnistNode({ type: "text", value: "Hello World!" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "text", value: "Hello World!" }, (b) => [
    b.schema.text("Hello World!"),
  ])
  .shouldMatchProseMirrorNode((b) => b.schema.text("Hello World"))
  .shouldConvertProseMirrorNode(
    (b) => b.schema.text("Hello World!"),
    [{ type: "text", value: "Hello World!" }],
  )
  .test();
