import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";

test("HorizontalRuleExtension handles the correct unist node", () => {
  const extension = new HorizontalRuleExtension();
  expect(extension.unistNodeName()).toBe("thematicBreak");
});
