import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new HorizontalRuleExtension(), {
  proseMirrorNodeName: "horizontal_rule",
  unistNodeName: "thematicBreak",
})
  .shouldMatchUnistNode({ type: "thematicBreak" })
  .shouldNotMatchUnistNode({ type: "horizontal_rule" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "thematicBreak" }, (schema) => [
    schema.nodes["horizontal_rule"].createAndFill()!,
  ])
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["horizontal_rule"].createAndFill()!
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["horizontal_rule"].createAndFill()!,
    [{ type: "thematicBreak" }]
  )
  .shouldMatchInputRule(
    "***",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---"
  )
  .shouldMatchInputRule(
    "---",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---"
  )
  .shouldMatchInputRule(
    "___",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---"
  )
  .shouldMatchInputRule(
    " ***",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---"
  )
  .shouldMatchInputRule(
    "  ***",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---"
  )
  .shouldMatchInputRule(
    "   ***",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---"
  )
  .shouldNotMatchInputRule("*-*", "\\*-\\*")
  .shouldNotMatchInputRule("*_*", "\\*\\_\\*")
  .shouldNotMatchInputRule("* **", "\\* \\*\\*")
  .shouldNotMatchInputRule("** *", "\\*\\* \\*")
  .shouldNotMatchInputRule("a***", "a\\*\\*\\*")
  .test();
