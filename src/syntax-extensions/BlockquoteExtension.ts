import type { BlockContent, Blockquote, DefinitionContent } from "mdast";
import { wrapIn } from "prosemirror-commands";
import { type InputRule, wrappingInputRule } from "prosemirror-inputrules";
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
export class BlockquoteExtension extends NodeExtension<Blockquote> {
  public unistNodeName(): "blockquote" {
    return "blockquote";
  }

  public proseMirrorNodeName(): string {
    return "blockquote";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "block+",
      group: "block",
      parseDOM: [{ tag: "blockquote" }],
      toDOM(): DOMOutputSpec {
        return ["blockquote", 0];
      },
    };
  }

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>
  ): Array<InputRule> {
    return [
      wrappingInputRule(
        /^\s{0,3}>\s$/,
        proseMirrorSchema.nodes[this.proseMirrorNodeName()]
      ),
    ];
  }

  public proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>
  ): Record<string, Command> {
    return {
      "Mod->": wrapIn(proseMirrorSchema.nodes[this.proseMirrorNodeName()]),
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Blockquote,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren
    );
  }

  public proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>
  ): Array<Blockquote> {
    return [
      {
        type: this.unistNodeName(),
        children: convertedChildren,
      },
    ];
  }
}
