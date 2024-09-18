import type { Node as UnistNode } from "unist";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new ItalicExtension(), {
  otherExtensionsInTest: [new BoldExtension()],
  proseMirrorMarkName: "em",
  unistNodeName: "emphasis",
})
  .shouldMatchUnistNode({ children: [], type: "emphasis" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      type: "emphasis",
    },
    (schema) => [
      schema.text("Hello World!").mark([schema.marks["em"].create()]),
    ],
  )
  .shouldMatchProseMirrorMark((schema) => schema.mark("em"))
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
      } as UnistNode,
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("em")]),
    [{ children: [{ type: "text", value: "Hello World!" }], type: "emphasis" }],
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create()],
    "start",
    "Mod-i",
    (schema) => [schema.nodes["paragraph"].create()],
    "",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcdef")])],
    { from: 3, to: 5 },
    "Mod-i",
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.text("ab"),
        schema.text("cd").mark([schema.mark("em")]),
        schema.text("ef"),
      ]),
    ],
    "ab*cd*ef",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create()],
    "start",
    "Mod-I",
    (schema) => [schema.nodes["paragraph"].create()],
    "",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcdef")])],
    { from: 3, to: 5 },
    "Mod-I",
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.text("ab"),
        schema.text("cd").mark([schema.mark("em")]),
        schema.text("ef"),
      ]),
    ],
    "ab*cd*ef",
  )
  .shouldMatchInputRule("*Test*", "*Test*", "Test")
  .shouldMatchInputRule("_Test_", "*Test*", "Test")
  .shouldMatchInputRule("*Hello World*", "*Hello World*", "Hello World")
  .shouldMatchInputRule("*Test*\n", "*Test*\n", (schema) => [
    schema.text("Test").mark([schema.mark("em")]),
    schema.text("\n"),
  ])
  .shouldMatchInputRule("_Test_\n", "*Test*\n", (schema) => [
    schema.text("Test").mark([schema.mark("em")]),
    schema.text("\n"),
  ])
  .shouldNotMatchInputRule("*Test_", "\\*Test\\_")
  .test();
