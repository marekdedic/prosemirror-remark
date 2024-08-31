import type { Break } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { chainCommands, exitCode } from "prosemirror-commands";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export class BreakExtension extends NodeExtension<Break> {
  public override proseMirrorKeymap(
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
      typeof navigator !== "undefined"
        ? /Mac|iP(hone|[oa]d)/u.test(navigator.platform) // eslint-disable-line @typescript-eslint/no-deprecated -- In the tested systems, it will be defined
        : false;

    return {
      "Mod-Enter": command,
      "Shift-Enter": command,
      ...(isMac && { "Ctrl-Enter": command }),
    };
  }

  public override proseMirrorNodeName(): string {
    return "hard_break";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
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

  public override proseMirrorNodeToUnistNodes(): Array<Break> {
    return [{ type: this.unistNodeName() }];
  }

  public override unistNodeName(): "break" {
    return "break";
  }

  public override unistNodeToProseMirrorNodes(
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
}
