import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new InlineCodeExtension(), {
  proseMirrorMarkName: "code",
  unistNodeName: "inlineCode",
})
  .shouldMatchUnistNode({ type: "inlineCode", value: "" })
  .shouldMatchUnistNode({ type: "inlineCode", value: "Test" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "inlineCode",
      value: "Hello World!",
    },
    (schema) => [
      schema.text("Hello World!").mark([schema.marks["code"].create()]),
    ]
  )
  .shouldMatchProseMirrorNode({ type: "text" }, (schema) => schema.mark("code"))
  .shouldNotMatchProseMirrorNode({ type: "other" }, (schema) =>
    schema.mark("code")
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("code")]),
    [{ type: "inlineCode", value: "Hello World!" }]
  )
  .shouldMatchInputRule("Test", "`Test`", "`Test`")
  .shouldMatchInputRule("Hello World", "`Hello World`", "`Hello World`")
  .test();
