import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new BoldExtension(), {
  proseMirrorMarkName: "strong",
  unistNodeName: "strong",
})
  .shouldMatchUnistNode({ type: "strong", children: [] })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "strong",
      children: [{ type: "text", value: "Hello World!" }],
    },
    (schema) => [
      schema.text("Hello World!").mark([schema.marks["strong"].create()]),
    ]
  )
  .shouldMatchProseMirrorNode({ type: "text" }, (schema) =>
    schema.mark("strong")
  )
  .shouldNotMatchProseMirrorNode({ type: "other" }, (schema) =>
    schema.mark("strong")
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("strong")]),
    [{ type: "strong", children: [{ type: "text", value: "Hello World!" }] }]
  )
  .shouldMatchInputRule("**Test**", "**Test**", "Test")
  .shouldMatchInputRule("__Test__", "**Test**", "Test")
  .shouldMatchInputRule("**Hello World**", "**Hello World**", "Hello World")
  .shouldMatchInputRule("**Test**\n", "**Test**\n", (schema) => [
    schema.text("Test").mark([schema.mark("strong")]),
    schema.text("\n"),
  ])
  .shouldMatchInputRule("__Test__\n", "**Test**\n", (schema) => [
    schema.text("Test").mark([schema.mark("strong")]),
    schema.text("\n"),
  ])
  .shouldNotMatchInputRule("*_Test**", "\\*\\_Test\\*\\*")
  .shouldNotMatchInputRule("_*Test**", "\\_\\*Test\\*\\*")
  .shouldNotMatchInputRule("**Test__", "\\*\\*Test\\_\\_")
  .shouldNotMatchInputRule("**Test_*", "\\*\\*Test\\_\\*")
  .shouldNotMatchInputRule("**Test*_", "\\*\\*Test\\*\\_")
  .shouldNotMatchInputRule("* *Test**", "\\* \\*Test\\*\\*")
  .shouldNotMatchInputRule("**Test* *", "\\*\\*Test\\* \\*")
  .test();
