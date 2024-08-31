import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

import type { UnistText } from "./TextExtension";

export interface UnistParagraph extends UnistNode {
  type: "paragraph";
  children: Array<UnistText>;
}

export class ParagraphExtension extends NodeExtension<UnistParagraph> {
  public override proseMirrorNodeName(): string {
    return "paragraph";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      toDOM(): DOMOutputSpec {
        return ["p", 0];
      },
    };
  }

  public override proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>,
  ): Array<UnistParagraph> {
    return [
      { type: "paragraph", children: convertedChildren as Array<UnistText> },
    ];
  }

  public override unistNodeName(): "paragraph" {
    return "paragraph";
  }

  public override unistNodeToProseMirrorNodes(
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
}
