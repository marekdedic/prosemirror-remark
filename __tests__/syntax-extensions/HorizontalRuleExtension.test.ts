import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { nodeExtensionTester } from "../nodeExtensionTester";

nodeExtensionTester(new HorizontalRuleExtension(), {
  unistNodeName: "thematicBreak",
});
