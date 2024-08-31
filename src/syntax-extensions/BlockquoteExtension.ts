import type { BlockContent, Blockquote, DefinitionContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { wrapIn } from "prosemirror-commands";
import { type InputRule, wrappingInputRule } from "prosemirror-inputrules";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export class BlockquoteExtension extends NodeExtension<Blockquote> {
  public override unistNodeName(): "blockquote" {
    return "blockquote";
  }

  public override proseMirrorNodeName(): string {
    return "blockquote";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "block+",
      group: "block",
      parseDOM: [{ tag: "blockquote" }],
      toDOM(): DOMOutputSpec {
        return ["blockquote", 0];
      },
    };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      wrappingInputRule(
        /^\s{0,3}>\s$/u,
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      "Mod->": wrapIn(proseMirrorSchema.nodes[this.proseMirrorNodeName()]),
    };
  }

  public override unistNodeToProseMirrorNodes(
    _node: Blockquote,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }

  public override proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>,
  ): Array<Blockquote> {
    return [
      {
        type: this.unistNodeName(),
        children: convertedChildren,
      },
    ];
  }
}
