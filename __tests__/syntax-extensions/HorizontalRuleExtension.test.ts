import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { NodeExtensionTester } from "../NodeExtensionTester";

// TODO: Re-evalueate
// eslint-disable-next-line jest/require-hook
new NodeExtensionTester(new HorizontalRuleExtension(), {
  unistNodeName: "thematicBreak",
})
  .shouldMatchUnistNode({ type: "thematicBreak" })
  .shouldNotMatchUnistNode({ type: "horizontal_rule" })
  .shouldNotMatchUnistNode({ type: "other" })
  .test();
