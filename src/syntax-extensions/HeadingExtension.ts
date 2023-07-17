import type { Heading, PhrasingContent } from "mdast";
import { setBlockType } from "prosemirror-commands";
import { type InputRule, textblockTypeInputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Command, EditorState } from "prosemirror-state";
import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";
import type { EditorView } from "prosemirror-view";

import { ParagraphExtension } from "./ParagraphExtension";
import { TextExtension } from "./TextExtension";

/**
 * @public
 */
export class HeadingExtension extends NodeExtension<Heading> {
  private static isAtStart(
    state: EditorState,
    view: EditorView | undefined,
  ): boolean {
    if (!state.selection.empty) {
      return false;
    }
    if (view !== undefined) {
      return view.endOfTextblock("backward", state);
    } else {
      return state.selection.$anchor.parentOffset > 0;
    }
  }

  public dependencies(): Array<Extension> {
    return [new ParagraphExtension(), new TextExtension()];
  }

  public unistNodeName(): "heading" {
    return "heading";
  }

  public proseMirrorNodeName(): string {
    return "heading";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      attrs: { level: { default: 1 } },
      content: "text*",
      group: "block",
      defining: true,
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return ["h" + (node.attrs.level as number).toString(), 0];
      },
    };
  }

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      textblockTypeInputRule(
        /^\s{0,3}(#{1,6})\s$/,
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
        (match) => ({ level: match[1].length }),
      ),
    ];
  }

  public proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const keymap: Record<string, Command> = {
      Tab: this.headingLevelCommandBuilder(proseMirrorSchema, +1, false),
      "#": this.headingLevelCommandBuilder(proseMirrorSchema, +1, true),
      "Shift-Tab": this.headingLevelCommandBuilder(
        proseMirrorSchema,
        -1,
        false,
      ),
      Backspace: this.headingLevelCommandBuilder(proseMirrorSchema, -1, true),
    };

    for (let i = 1; i <= 6; i++) {
      keymap[`Shift-Mod-${i}`] = setBlockType(
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
        { level: i },
      );
    }

    return keymap;
  }

  public unistNodeToProseMirrorNodes(
    node: Heading,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
      {
        level: node.depth,
      },
    );
  }

  public proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<PhrasingContent>,
  ): Array<Heading> {
    return [
      {
        type: this.unistNodeName(),
        depth: node.attrs.level as 1 | 2 | 3 | 4 | 5 | 6,
        children: convertedChildren,
      },
    ];
  }

  private headingLevelCommandBuilder(
    proseMirrorSchema: Schema<string, string>,
    levelUpdate: -1 | 1,
    onlyAtStart: boolean,
  ): Command {
    return (state, dispatch, view) => {
      if (onlyAtStart && !HeadingExtension.isAtStart(state, view)) {
        return false;
      }

      const { $anchor } = state.selection;
      const headingNode = $anchor.parent;
      if (headingNode.type.name !== "heading") {
        return false;
      }

      if (dispatch === undefined) {
        return true;
      }

      const headingPosition = $anchor.before($anchor.depth);
      const newHeadingLevel = Math.min(
        6,
        Math.max(0, (headingNode.attrs.level as number) + levelUpdate),
      );

      if (newHeadingLevel > 0) {
        dispatch(
          state.tr.setNodeMarkup(headingPosition, undefined, {
            level: newHeadingLevel,
          }),
        );
      } else {
        dispatch(
          state.tr.setNodeMarkup(
            headingPosition,
            proseMirrorSchema.nodes["paragraph"],
          ),
        );
      }
      return true;
    };
  }
}
