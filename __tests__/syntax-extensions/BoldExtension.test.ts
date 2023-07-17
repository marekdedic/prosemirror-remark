import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new BoldExtension(), {
  proseMirrorMarkName: "strong",
  unistNodeName: "strong",
  otherExtensionsInTest: [new ItalicExtension()],
})
  .shouldMatchUnistNode({ type: "strong", children: [] })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "strong",
      children: [{ type: "text", value: "Hello World!" }],
    },
    (schema) => [
      schema.text("Hello World!").mark([schema.marks.strong.create()]),
    ],
  )
  .shouldMatchProseMirrorNode({ type: "text" }, (schema) =>
    schema.mark("strong"),
  )
  .shouldNotMatchProseMirrorNode({ type: "other" }, (schema) =>
    schema.mark("strong"),
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("strong")]),
    [{ type: "strong", children: [{ type: "text", value: "Hello World!" }] }],
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
  .shouldNotMatchInputRule("*_Test**", "*\\_Test\\**", (schema) => [
    schema.text("_Test*").mark([schema.mark("em")]),
  ])
  .shouldNotMatchInputRule("_*Test**", "\\_*Test\\**", (schema) => [
    schema.text("_"),
    schema.text("Test*").mark([schema.mark("em")]),
  ])
  .shouldNotMatchInputRule("**Test__", "\\*\\*Test\\_\\_")
  .shouldNotMatchInputRule("**Test_*", "\\*\\*Test\\_\\*")
  .shouldNotMatchInputRule("**Test*_", "\\*\\*Test\\*\\_")
  .shouldNotMatchInputRule("* *Test**", "\\* *Test\\**", (schema) => [
    schema.text("* "),
    schema.text("Test*").mark([schema.mark("em")]),
  ])
  .shouldNotMatchInputRule("**Test* *", "\\*\\*Test\\* \\*")
  .test();
