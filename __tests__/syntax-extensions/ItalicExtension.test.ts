import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new ItalicExtension(), {
  proseMirrorMarkName: "em",
  unistNodeName: "emphasis",
})
  .shouldMatchUnistNode({ type: "emphasis", children: [] })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "emphasis",
      children: [{ type: "text", value: "Hello World!" }],
    },
    (schema) => [
      schema.text("Hello World!").mark([schema.marks["em"].create()]),
    ]
  )
  .shouldMatchProseMirrorNode({ type: "text" }, (schema) => schema.mark("em"))
  .shouldNotMatchProseMirrorNode({ type: "other" }, (schema) =>
    schema.mark("em")
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("em")]),
    [{ type: "emphasis", children: [{ type: "text", value: "Hello World!" }] }]
  )
  // TODO: Add newline test
  .shouldMatchInputRule("*Test*", "*Test*", "Test")
  .shouldMatchInputRule("_Test_", "*Test*", "Test")
  .shouldMatchInputRule("*Hello World*", "*Hello World*", "Hello World")
  .shouldNotMatchInputRule("*Test_", "\\*Test\\_")
  .test();
