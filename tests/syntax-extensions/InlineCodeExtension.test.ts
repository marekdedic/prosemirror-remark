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
    ],
  )
  .shouldMatchProseMirrorMark((schema) => schema.mark("code"))
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("code")]),
    [{ type: "inlineCode", value: "Hello World!" }],
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create()],
    "start",
    "`",
    { ctrlKey: true },
    (schema) => [schema.nodes["paragraph"].create()],
    "",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcdef")])],
    { from: 3, to: 5 },
    "`",
    { ctrlKey: true },
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.text("ab"),
        schema.text("cd").mark([schema.mark("code")]),
        schema.text("ef"),
      ]),
    ],
    "ab`cd`ef",
  )
  .shouldMatchInputRule("`Test`", "`Test`", "Test")
  .shouldMatchInputRule("`Hello World`", "`Hello World`", "Hello World")
  .shouldMatchInputRule("`Test`\n", "`Test`\n", (schema) => [
    schema.text("Test").mark([schema.mark("code")]),
    schema.text("\n"),
  ])
  .test();
