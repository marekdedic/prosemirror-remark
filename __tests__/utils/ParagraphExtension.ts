import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

import type { UnistText } from "./TextExtension";

export interface UnistParagraph extends UnistNode {
  children: Array<UnistText>;
  type: "paragraph";
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
      { children: convertedChildren as Array<UnistText>, type: "paragraph" },
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
