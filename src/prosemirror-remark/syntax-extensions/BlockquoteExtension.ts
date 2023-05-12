import type { BlockContent, Blockquote, DefinitionContent } from "mdast";
import { wrapIn } from "prosemirror-commands";
import { type InputRule, wrappingInputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { NodeExtension } from "../../prosemirror-unified";

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

  public proseMirrorInputRules(): Array<InputRule> {
    return [
      wrappingInputRule(
        /^>\s$/,
        this.proseMirrorSchema().nodes[this.proseMirrorNodeName()]
      ),
    ];
  }

  public proseMirrorKeymap(): Record<string, Command> {
    return {
      "Mod->": wrapIn(
        this.proseMirrorSchema().nodes[this.proseMirrorNodeName()]
      ),
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Blockquote,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
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
