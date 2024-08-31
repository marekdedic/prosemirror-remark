import type { ThematicBreak } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { InputRule } from "prosemirror-inputrules";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export class HorizontalRuleExtension extends NodeExtension<ThematicBreak> {
  public override unistNodeName(): "thematicBreak" {
    return "thematicBreak";
  }

  public override proseMirrorNodeName(): string {
    return "horizontal_rule";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM(): DOMOutputSpec {
        return ["div", ["hr"]];
      },
    };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new InputRule(/^\s{0,3}(?:\*\*\*|---|___)\n$/u, (state, _, start, end) =>
        state.tr.replaceWith(
          start,
          end,
          createProseMirrorNode(
            this.proseMirrorNodeName(),
            proseMirrorSchema,
            [],
          ),
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

  public override proseMirrorNodeToUnistNodes(): Array<ThematicBreak> {
    return [
      {
        type: this.unistNodeName(),
      },
    ];
  }
}
