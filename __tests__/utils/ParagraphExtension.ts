import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import type { UnistText } from "./TextExtension";

export interface UnistParagraph extends UnistNode {
  type: "paragraph";
  children: Array<UnistText>;
}

export class ParagraphExtension extends NodeExtension<UnistParagraph> {
  public unistNodeName(): "paragraph" {
    return "paragraph";
  }

  public proseMirrorNodeName(): string {
    return "paragraph";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      toDOM(): DOMOutputSpec {
        return ["p", 0];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _: UnistParagraph,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }

  public proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>,
  ): Array<UnistParagraph> {
    return [
      { type: "paragraph", children: convertedChildren as Array<UnistText> },
    ];
  }
}
