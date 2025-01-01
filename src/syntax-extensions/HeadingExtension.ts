import type { Heading, PhrasingContent } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command, EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { setBlockType } from "prosemirror-commands";
import { type InputRule, textblockTypeInputRule } from "prosemirror-inputrules";
import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";

import { ParagraphExtension } from "./ParagraphExtension";
import { TextExtension } from "./TextExtension";

/**
 * @public
 */
export class HeadingExtension extends NodeExtension<Heading> {
  private static headingLevelCommandBuilder(
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

      const newHeadingLevel =
        (headingNode.attrs["level"] as number) + levelUpdate;

      if (newHeadingLevel < 0 || newHeadingLevel > 6) {
        return false;
      }
      if (dispatch === undefined) {
        return true;
      }

      const headingPosition = $anchor.before($anchor.depth);

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

  private static isAtStart(
    state: EditorState,
    view: EditorView | undefined,
  ): boolean {
    if (!state.selection.empty) {
      return false;
    }
    if (view !== undefined) {
      return view.endOfTextblock("backward", state);
    }
    return state.selection.$anchor.parentOffset > 0;
  }

  public override dependencies(): Array<Extension> {
    return [new ParagraphExtension(), new TextExtension()];
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      textblockTypeInputRule(
        /^\s{0,3}(#{1,6})\s$/u,
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
        (match) => ({ level: match[1].length }),
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const keymap: Record<string, Command> = {
      "#": HeadingExtension.headingLevelCommandBuilder(
        proseMirrorSchema,
        +1,
        true,
      ),
      Backspace: HeadingExtension.headingLevelCommandBuilder(
        proseMirrorSchema,
        -1,
        true,
      ),
      "Shift-Tab": HeadingExtension.headingLevelCommandBuilder(
        proseMirrorSchema,
        -1,
        false,
      ),
      Tab: HeadingExtension.headingLevelCommandBuilder(
        proseMirrorSchema,
        +1,
        false,
      ),
    };

    for (let i = 1; i <= 6; i++) {
      keymap[`Shift-Mod-${i.toString()}`] = setBlockType(
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
        { level: i },
      );
    }
    return keymap;
  }

  public override proseMirrorNodeName(): string {
    return "heading";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      attrs: { level: { default: 1 } },
      content: "text*",
      defining: true,
      group: "block",
      parseDOM: [
        { attrs: { level: 1 }, tag: "h1" },
        { attrs: { level: 2 }, tag: "h2" },
        { attrs: { level: 3 }, tag: "h3" },
        { attrs: { level: 4 }, tag: "h4" },
        { attrs: { level: 5 }, tag: "h5" },
        { attrs: { level: 6 }, tag: "h6" },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return [`h${(node.attrs["level"] as number).toString()}`, 0];
      },
    };
  }

  public override proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<PhrasingContent>,
  ): Array<Heading> {
    return [
      {
        children: convertedChildren,
        depth: node.attrs["level"] as 1 | 2 | 3 | 4 | 5 | 6,
        type: this.unistNodeName(),
      },
    ];
  }

  public override unistNodeName(): "heading" {
    return "heading";
  }

  public override unistNodeToProseMirrorNodes(
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
}
