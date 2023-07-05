import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new HorizontalRuleExtension(), {
  unistNodeName: "thematicBreak",
})
  .shouldMatchUnistNode({ type: "thematicBreak" })
  .shouldNotMatchUnistNode({ type: "horizontal_rule" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldMatchInputRule("***", "---\n")
  .shouldMatchInputRule("---", "---\n")
  .shouldMatchInputRule("___", "---\n")
  .shouldMatchInputRule(" ***", "---\n")
  .shouldMatchInputRule("  ***", "---\n")
  .shouldMatchInputRule("   ***", "---\n")
  .shouldNotMatchInputRule("* **", "\\* \\*\\*")
  .shouldNotMatchInputRule("** *", "\\*\\* \\*")
  .shouldNotMatchInputRule("a***", "a\\*\\*\\*")
  .test();
