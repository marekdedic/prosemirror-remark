import type { InputRule } from "prosemirror-inputrules";

// Sets inCodeMark: false on a rule built by wrappingInputRule, which can't be
// given InputRule options, so that the rule doesn't apply to inline code.
// Until https://code.haverbeke.berlin/prosemirror/prosemirror/issues/1627
// adds an options parameter to wrappingInputRule.
export function skipInCodeMark(rule: InputRule): InputRule {
  rule.inCodeMark = false;
  return rule;
}
