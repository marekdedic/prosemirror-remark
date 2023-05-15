import type { Break } from "mdast";
import { chainCommands, exitCode } from "prosemirror-commands";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";
import { NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export class BreakExtension extends NodeExtension<Break> {
  public unistNodeName(): "break" {
    return "break";
  }

  public proseMirrorNodeName(): string {
    return "hard_break";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{ tag: "br" }],
      toDOM(): DOMOutputSpec {
        return ["br"];
      },
    };
  }

  public proseMirrorKeymap(): Record<string, Command> {
    const command = chainCommands(exitCode, (state, dispatch) => {
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
    });

    const isMac =
      typeof navigator != "undefined"
        ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) // eslint-disable-line deprecation/deprecation
        : false;

    return {
      "Mod-Enter": command,
      "Shift-Enter": command,
      ...(isMac && { "Ctrl-Enter": command }),
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Break,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(): Array<Break> {
    return [{ type: this.unistNodeName() }];
  }
}
