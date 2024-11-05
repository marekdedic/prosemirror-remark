import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new BoldExtension(), {
  otherExtensionsInTest: [new ItalicExtension()],
  proseMirrorMarkName: "strong",
  unistNodeName: "strong",
})
  .shouldMatchUnistNode({ children: [], type: "strong" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      type: "strong",
    },
    (schema) => [
      schema.text("Hello World!").mark([schema.marks["strong"].create()]),
    ],
  )
  .shouldMatchProseMirrorMark((schema) => schema.mark("strong"))
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("strong")]),
    [{ children: [{ type: "text", value: "Hello World!" }], type: "strong" }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Hello World!")
        .mark([schema.mark("em"), schema.mark("strong")]),
    [
      {
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "emphasis",
          },
        ],
        type: "strong",
      },
    ],
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create()],
    "start",
    "Mod-b",
    (schema) => [schema.nodes["paragraph"].create()],
    "",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcdef")])],
    { from: 3, to: 5 },
    "Mod-b",
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.text("ab"),
        schema.text("cd").mark([schema.mark("strong")]),
        schema.text("ef"),
      ]),
    ],
    "ab**cd**ef",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create()],
    "start",
    "Mod-B",
    (schema) => [schema.nodes["paragraph"].create()],
    "",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcdef")])],
    { from: 3, to: 5 },
    "Mod-B",
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.text("ab"),
        schema.text("cd").mark([schema.mark("strong")]),
        schema.text("ef"),
      ]),
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
  .shouldNotMatchInputRule(
    "X*_Test**X",
    "&#x58;*\\_Test\\**&#x58;",
    (schema) => [
      schema.text("X"),
      schema.text("_Test*").mark([schema.mark("em")]),
      schema.text("X"),
    ],
  )
  .shouldNotMatchInputRule("X_*Test**X", "X\\_*Test\\**&#x58;", (schema) => [
    schema.text("X_"),
    schema.text("Test*").mark([schema.mark("em")]),
    schema.text("X"),
  ])
  .shouldNotMatchInputRule("**Test__", "\\*\\*Test\\_\\_")
  .shouldNotMatchInputRule("**Test_*", "\\*\\*Test\\_\\*")
  .shouldNotMatchInputRule("**Test*_", "\\*\\*Test\\*\\_")
  .shouldNotMatchInputRule("X* *Test**X", "X\\* *Test\\**&#x58;", (schema) => [
    schema.text("X* "),
    schema.text("Test*").mark([schema.mark("em")]),
    schema.text("X"),
  ])
  .shouldNotMatchInputRule("**Test* *", "\\*\\*Test\\* \\*")
  .test();
