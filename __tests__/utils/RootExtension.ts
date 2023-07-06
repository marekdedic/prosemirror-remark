import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import type { UnistParagraph } from "./ParagraphExtension";

interface UnistRoot<ChildUnistNode extends UnistNode> extends UnistNode {
  type: "root";
  children: Array<ChildUnistNode | UnistParagraph>;
}

export class RootExtension<
  ChildUnistNode extends UnistNode
> extends NodeExtension<UnistRoot<ChildUnistNode>> {
  public unistNodeName(): "root" {
    return "root";
  }

  public proseMirrorNodeName(): string {
    return "doc";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "block+",
    };
  }

  public unistNodeToProseMirrorNodes(
    _: UnistRoot<ChildUnistNode>,
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
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UnistRoot<ChildUnistNode>> {
    return [
      {
        type: "root",
        children: convertedChildren as Array<ChildUnistNode>,
      },
    ];
  }
}
