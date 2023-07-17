import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new HorizontalRuleExtension(), {
  proseMirrorNodeName: "horizontal_rule",
  unistNodeName: "thematicBreak",
  otherExtensionsInTest: [new BoldExtension(), new ItalicExtension()],
})
  .shouldMatchUnistNode({ type: "thematicBreak" })
  .shouldNotMatchUnistNode({ type: "horizontal_rule" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "thematicBreak" }, (schema) => [
    schema.nodes["horizontal_rule"].createAndFill()!,
  ])
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["horizontal_rule"].createAndFill()!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["horizontal_rule"].createAndFill()!,
    [{ type: "thematicBreak" }],
  )
  .shouldMatchInputRule(
    "***\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    "---\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    "___\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    " ***\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    "  ***\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    "   ***\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldNotMatchInputRule("*-*\n", "*-*", (schema) => [
    schema.nodes["paragraph"].createAndFill({}, [
      schema.text("-").mark([schema.marks["em"].create()]),
      schema.text("\n"),
    ])!,
  ])
  .shouldNotMatchInputRule("*_*\n", "*\\_*", (schema) => [
    schema.nodes["paragraph"].createAndFill({}, [
      schema.text("_").mark([schema.marks["em"].create()]),
      schema.text("\n"),
    ])!,
  ])
  .shouldNotMatchInputRule("* **\n", "\\* \\*\\*")
  .shouldNotMatchInputRule("** *\n", "\\*\\* \\*")
  .shouldNotMatchInputRule("a***\n", "a\\*\\*\\*")
  .shouldNotMatchInputRule(
    "***bold italic***",
    "**\\*bold italic**\\*",
    (schema) => [
      schema.nodes["paragraph"].createAndFill({}, [
        schema.text("*bold italic").mark([schema.marks["strong"].create()]),
        schema.text("*"),
      ])!,
    ],
  )
  .test();
