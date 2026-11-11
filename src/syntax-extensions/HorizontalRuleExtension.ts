import type { ThematicBreak } from "mdast";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import {
  createProseMirrorNode,
  EnterInputRule,
  NodeExtension,
} from "prosemirror-unified";

import { replaceParagraphOnEnter } from "../utils/replaceParagraphOnEnter";

export class HorizontalRuleExtension extends NodeExtension<ThematicBreak> {
  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      // On Enter at the end of a paragraph, replaces the paragraph with a
      // horizontal rule and a new paragraph for the cursor, instead of Enter
      // splitting it afterwards. Elsewhere, Enter is handled as usual.
      new EnterInputRule(
        /^\s{0,3}(?:\*\*\*|---|___)\n$/u,
        (state, _, start, end) =>
          replaceParagraphOnEnter(
            state,
            start,
            end,
            proseMirrorSchema.nodes[this.proseMirrorNodeName()],
          ),
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      "Mod-_": (state, dispatch): true => {
        if (dispatch) {
          dispatch(
            state.tr
              .replaceSelectionWith(
                proseMirrorSchema.nodes[this.proseMirrorNodeName()].create(),
              )
              .scrollIntoView(),
          );
        }
        return true;
      },
    };
  }

  public override proseMirrorNodeName(): string {
    return "horizontal_rule";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM: (): DOMOutputSpec => ["div", ["hr"]],
    };
  }

  public override proseMirrorNodeToUnistNodes(): Array<ThematicBreak> {
    return [
      {
        type: this.unistNodeName(),
      },
    ];
  }

  public override unistNodeName(): "thematicBreak" {
    return "thematicBreak";
  }

  public override unistNodeToProseMirrorNodes(
    _node: ThematicBreak,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }
}
