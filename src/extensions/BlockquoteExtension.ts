import type { BlockContent, Blockquote, DefinitionContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../NodeExtension";

export class BlockquoteExtension extends NodeExtension<Blockquote> {
  public mdastNodeName(): "blockquote" {
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

  public mdastNodeToProseMirrorNodes(
    _node: Blockquote,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema<string, string>
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes[
      this.proseMirrorNodeName()
    ].createAndFill({}, convertedChildren);
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public proseMirrorNodeToMdastNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>
  ): Array<Blockquote> {
    return [
      {
        type: this.mdastNodeName(),
        children: convertedChildren,
      },
    ];
  }
}
