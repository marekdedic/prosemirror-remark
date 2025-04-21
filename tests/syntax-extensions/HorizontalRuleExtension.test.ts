import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new HorizontalRuleExtension(), {
  otherExtensionsInTest: [new BoldExtension(), new ItalicExtension()],
  proseMirrorNodeName: "horizontal_rule",
  unistNodeName: "thematicBreak",
})
  .shouldMatchUnistNode({ type: "thematicBreak" })
  .shouldNotMatchUnistNode({ type: "horizontal_rule" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "thematicBreak" }, (schema) => [
    schema.nodes["horizontal_rule"].create(),
  ])
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["horizontal_rule"].create(),
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["horizontal_rule"].create(),
    [{ type: "thematicBreak" }],
  )
  .shouldSupportKeymap(
    () => [],
    "start",
    "_",
    { ctrlKey: true },
    (schema) => [schema.nodes["horizontal_rule"].create()],
    "---",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcdef")])],
    4,
    "_",
    { ctrlKey: true },
    (schema) => [
      schema.nodes["paragraph"].create({}, [schema.text("abc")]),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create({}, [schema.text("def")]),
    ],
    "abc\n\n---\n\ndef",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("abcdef")])],
    { from: 3, to: 5 },
    "_",
    { ctrlKey: true },
    (schema) => [
      schema.nodes["paragraph"].create({}, [schema.text("ab")]),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create({}, [schema.text("ef")]),
    ],
    "ab\n\n---\n\nef",
  )
  .shouldMatchInputRule(
    "***{Enter}",
    (schema) => [
      schema.nodes["paragraph"].create(),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create(),
    ],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    "---{Enter}",
    (schema) => [
      schema.nodes["paragraph"].create(),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create(),
    ],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    "___{Enter}",
    (schema) => [
      schema.nodes["paragraph"].create(),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create(),
    ],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    " ***{Enter}",
    (schema) => [
      schema.nodes["paragraph"].create(),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create(),
    ],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    "  ***{Enter}",
    (schema) => [
      schema.nodes["paragraph"].create(),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create(),
    ],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    "   ***{Enter}",
    (schema) => [
      schema.nodes["paragraph"].create(),
      schema.nodes["horizontal_rule"].create(),
      schema.nodes["paragraph"].create(),
    ],
    "\n\n---\n",
  )
  .shouldNotMatchInputRule("*-*{Enter}", "*-*\n", (schema) => [
    schema.nodes["paragraph"].create({}, [
      schema.text("-").mark([schema.marks["em"].create()]),
    ]),
    schema.nodes["paragraph"].create(),
  ])
  .shouldNotMatchInputRule("*_*{Enter}", "*\\_*\n", (schema) => [
    schema.nodes["paragraph"].create({}, [
      schema.text("_").mark([schema.marks["em"].create()]),
    ]),
    schema.nodes["paragraph"].create(),
  ])
  .shouldNotMatchInputRule("* **{Enter}", "\\* \\*\\*\n", (schema) => [
    schema.nodes["paragraph"].create({}, [schema.text("* **")]),
    schema.nodes["paragraph"].create(),
  ])
  .shouldNotMatchInputRule("** *{Enter}", "\\*\\* \\*\n", (schema) => [
    schema.nodes["paragraph"].create({}, [schema.text("** *")]),
    schema.nodes["paragraph"].create(),
  ])
  .shouldNotMatchInputRule("a***{Enter}", "a\\*\\*\\*\n", (schema) => [
    schema.nodes["paragraph"].create({}, [schema.text("a***")]),
    schema.nodes["paragraph"].create(),
  ])
  .shouldNotMatchInputRule(
    "***bold italic***",
    "**\\*bold italic**\\*",
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.text("*bold italic").mark([schema.marks["strong"].create()]),
        schema.text("*"),
      ]),
    ],
  )
  .test();
