import type { Code, Text } from "mdast";
import { setBlockType } from "prosemirror-commands";
import { type InputRule, textblockTypeInputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import {
  type Command,
  type EditorState,
  Selection,
  type Transaction,
} from "prosemirror-state";
import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";

import { TextExtension } from "./TextExtension";

/**
 * @public
 */
export class CodeBlockExtension extends NodeExtension<Code> {
  private static liftOutOfCodeBlock() {
    return (
      state: EditorState,
      dispatch?: (tr: Transaction) => void,
    ): boolean => {
      const { $from, $to } = state.selection;
      if (
        // Mustn't be a complex selection
        !$from.sameParent($to) ||
        // Must be in a code block
        $from.parent.type.name !== "code_block" ||
        // Must be at the end of the code block
        $from.parentOffset !== $from.parent.content.size ||
        // There must already be a preceding empty line
        !$from.parent.textBetween(0, $from.parentOffset).endsWith("\n\n")
      ) {
        return false;
      }
      if (dispatch) {
        const tr = state.tr;
        dispatch(
          tr
            // Delete the preceding empty line
            .deleteRange($from.pos - 2, $from.pos)
            // Insert empty paragraph
            .insert(
              $from.pos - 1,
              tr.doc.type.schema.nodes.paragraph.createAndFill()!,
            )
            // Put the cursor into the empty paragraph
            .setSelection(Selection.near(tr.doc.resolve($from.pos), 1))
            .scrollIntoView(),
        );
      }
      return true;
    };
  }

  public override dependencies(): Array<Extension> {
    return [new TextExtension()];
  }

  public override unistNodeName(): "code" {
    return "code";
  }

  public override proseMirrorNodeName(): string {
    return "code_block";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "text*",
      group: "block",
      code: true,
      defining: true,
      marks: "",
      parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
      toDOM(): DOMOutputSpec {
        return ["pre", ["code", 0]];
      },
    };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      textblockTypeInputRule(
        /^\s{0,3}```$/u,
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
      ),
      textblockTypeInputRule(
        /^\s{4}$/u,
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      "Shift-Mod-\\": setBlockType(
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
      ),
      Enter: CodeBlockExtension.liftOutOfCodeBlock(),
    };
  }

  public override unistNodeToProseMirrorNodes(
    node: Code,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      [proseMirrorSchema.text(node.value)],
    );
  }

  public override proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<Text>,
  ): Array<Code> {
    return [
      {
        type: this.unistNodeName(),
        value: convertedChildren.map((child) => child.value).join(""),
      },
    ];
  }
}
