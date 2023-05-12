import type { ThematicBreak } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { NodeExtension } from "../../prosemirror-unified";

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

  // TODO: Add inpur rules

  public proseMirrorKeymap(): Record<string, Command> {
    return {
      "Mod-_": (state, dispatch): true => {
        if (dispatch) {
          dispatch(
            state.tr
              .replaceSelectionWith(
                this.proseMirrorSchema().nodes[
                  this.proseMirrorNodeName()
                ].create()
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
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(): Array<ThematicBreak> {
    return [
      {
        type: this.unistNodeName(),
      },
    ];
  }
}
