import type { Node as UnistNode } from "unist";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new ItalicExtension(), {
  proseMirrorMarkName: "em",
  unistNodeName: "emphasis",
  otherExtensionsInTest: [new BoldExtension()],
})
  .shouldMatchUnistNode({ type: "emphasis", children: [] })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "emphasis",
      children: [{ type: "text", value: "Hello World!" }],
    },
    (schema) => [schema.text("Hello World!").mark([schema.marks.em.create()])],
  )
  .shouldMatchProseMirrorMark((schema) => schema.mark("em"))
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
      } as UnistNode,
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.text("Hello World!").mark([schema.mark("em")]),
    [{ type: "emphasis", children: [{ type: "text", value: "Hello World!" }] }],
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
