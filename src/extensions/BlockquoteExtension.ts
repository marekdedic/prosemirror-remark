import type { BlockContent, Blockquote, DefinitionContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../NodeExtension";

export class BlockquoteExtension extends NodeExtension {
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

  // TODO: Specialize schema generic
  public mdastNodeToProseMirrorNodes(
    _: Blockquote,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
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
    _: ProseMirrorNode,
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
