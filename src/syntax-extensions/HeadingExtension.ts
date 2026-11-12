import type { Heading, PhrasingContent } from "mdast";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { setBlockType } from "prosemirror-commands";
import {
  createProseMirrorNode,
  EnterInputRule,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";

import { isAtStart } from "../utils/isAtStart";
import { replaceParagraphOnEnter } from "../utils/replaceParagraphOnEnter";
import { ParagraphExtension } from "./ParagraphExtension";
import { TextExtension } from "./TextExtension";

export class HeadingExtension extends NodeExtension<Heading> {
  private static headingLevelCommandBuilder(
    proseMirrorSchema: Schema<string, string>,
    levelUpdate: -1 | 1,
    onlyAtStart: boolean,
  ): Command {
    return (state, dispatch, view) => {
      if (onlyAtStart && !isAtStart(state, view)) {
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

  public override dependencies(): Array<Extension> {
    return [new ParagraphExtension(), new TextExtension()];
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      // Like textblockTypeInputRule on a space. Unlike the blockquote and list
      // rules, this one also applies on Enter (\s matches the line ending Enter
      // is passed as), as an empty heading followed by a new paragraph. There,
      // Enter in the new empty block would lift it out again, undoing the
      // rule. On Enter, it replaces the paragraph itself, so that the following
      // Enter handling can't lift the heading out of a list or blockquote, and
      // applies only at the end of the line.
      new EnterInputRule(
        /^\s{0,3}(?<hashes>#{1,6})\s$/u,
        (state, match, start, end) => {
          const nodeType = proseMirrorSchema.nodes[this.proseMirrorNodeName()];
          const attrs = { level: match.groups?.["hashes"].length };
          if (match[0].endsWith("\n")) {
            return replaceParagraphOnEnter(state, start, end, nodeType, attrs);
          }
          const $start = state.doc.resolve(start);
          if (
            !$start
              .node(-1)
              .canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)
          ) {
            return null;
          }
          return state.tr
            .delete(start, end)
            .setBlockType(start, start, nodeType, attrs);
        },
        { inCodeMark: false },
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const keymap: Record<string, Command> = {
      "#": HeadingExtension.headingLevelCommandBuilder(
        proseMirrorSchema,
        1,
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
        1,
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
      toDOM: (node: ProseMirrorNode): DOMOutputSpec => [
        `h${(node.attrs["level"] as number).toString()}`,
        0,
      ],
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
