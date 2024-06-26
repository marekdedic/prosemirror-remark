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
  .shouldMatchProseMirrorMark((schema) => schema.mark("strong"))
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("strong")]),
    [{ type: "strong", children: [{ type: "text", value: "Hello World!" }] }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Hello World!")
        .mark([schema.mark("em"), schema.mark("strong")]),
    [
      {
        type: "strong",
        children: [
          {
            type: "emphasis",
            children: [{ type: "text", value: "Hello World!" }],
          },
        ],
      },
    ],
  )
  .shouldSupportKeymap(
    () => [],
    "start",
    "Mod-b",
    () => [],
    "",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("abcdef")])!,
    ],
    { from: 3, to: 5 },
    "Mod-b",
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [
        schema.text("ab"),
        schema.text("cd").mark([schema.mark("strong")]),
        schema.text("ef"),
      ])!,
    ],
    "ab**cd**ef",
  )
  .shouldSupportKeymap(
    () => [],
    "start",
    "Mod-B",
    () => [],
    "",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("abcdef")])!,
    ],
    { from: 3, to: 5 },
    "Mod-B",
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [
        schema.text("ab"),
        schema.text("cd").mark([schema.mark("strong")]),
        schema.text("ef"),
      ])!,
    ],
    "ab**cd**ef",
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
