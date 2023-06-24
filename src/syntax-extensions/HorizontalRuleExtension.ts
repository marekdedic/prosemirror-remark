import type { ThematicBreak } from "mdast";
import { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export class HorizontalRuleExtension extends NodeExtension<ThematicBreak> {
  public unistNodeName(): "thematicBreak" {
    return "thematicBreak";
  }

  public proseMirrorNodeName(): string {
    return "horizontal_rule";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM(): DOMOutputSpec {
        return ["div", ["hr"]];
      },
    };
  }

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>
  ): Array<InputRule> {
    // TODO: Require newline after - to not trigger on ***bold italic*** text
    return [
      new InputRule(/^\s{0,3}(?:\*\*\*|---|___)$/, (state, _, start, end) => {
        return state.tr.replaceWith(
          start,
          end,
          createProseMirrorNode(
            this.proseMirrorNodeName(),
            proseMirrorSchema,
            []
          )
        );
      }),
    ];
  }

  public proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>
  ): Record<string, Command> {
    return {
      "Mod-_": (state, dispatch): true => {
        if (dispatch) {
          dispatch(
            state.tr
              .replaceSelectionWith(
                proseMirrorSchema.nodes[this.proseMirrorNodeName()].create()
              )
              .scrollIntoView()
          );
        }
        return true;
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: ThematicBreak,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren
    );
  }

  public proseMirrorNodeToUnistNodes(): Array<ThematicBreak> {
    return [
      {
        type: this.unistNodeName(),
      },
    ];
  }
}
