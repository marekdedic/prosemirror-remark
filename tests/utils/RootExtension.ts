import type {
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

import type { UnistParagraph } from "./ParagraphExtension";

interface UnistRoot<ChildUnistNode extends UnistNode> extends UnistNode {
  children: Array<ChildUnistNode | UnistParagraph>;
  type: "root";
}

export class RootExtension<
  ChildUnistNode extends UnistNode,
> extends NodeExtension<UnistRoot<ChildUnistNode>> {
  public override proseMirrorNodeName(): string {
    return "doc";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "block+",
    };
  }

  public override proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>,
  ): Array<UnistRoot<ChildUnistNode>> {
    return [
      {
        children: convertedChildren as Array<ChildUnistNode>,
        type: "root",
      },
    ];
  }

  public override unistNodeName(): "root" {
    return "root";
  }

  public override unistNodeToProseMirrorNodes(
    _: UnistRoot<ChildUnistNode>,
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
