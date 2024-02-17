import type { Break } from "mdast";
import { chainCommands, exitCode } from "prosemirror-commands";
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

  public proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const command = chainCommands(exitCode, (state, dispatch) => {
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
    });

    const isMac =
      typeof navigator != "undefined"
        ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) // eslint-disable-line deprecation/deprecation -- In the tested systems, it will be defined
        : false;

    return {
      "Mod-Enter": command,
      "Shift-Enter": command,
      ...(isMac && { "Ctrl-Enter": command }),
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Break,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }

  public proseMirrorNodeToUnistNodes(): Array<Break> {
    return [{ type: this.unistNodeName() }];
  }
}
