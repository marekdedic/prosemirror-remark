import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { NodeExtensionTester } from "../NodeExtensionTester";

new NodeExtensionTester(new HorizontalRuleExtension(), {
  unistNodeName: "thematicBreak",
}).test();
