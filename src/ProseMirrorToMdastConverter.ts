import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { NodeExtension } from "./NodeExtension";

export class ProseMirrorToMdastConverter {
  private readonly nodeExtensions: Array<NodeExtension>;

  public constructor(nodeExtensions: Array<NodeExtension>) {
    this.nodeExtensions = nodeExtensions;
  }

  // TODO: Move schema to a property?
  // TODO: Better error handling?
  // TODO: Support marks
  public convert(node: ProseMirrorNode): UnistNode | null {
    const rootNode = this.convertNode(node);
    if (rootNode.length !== 1) {
      return null;
    }
    return rootNode[0];
  }

  private convertNode(node: ProseMirrorNode): Array<UnistNode> {
    for (const extension of this.nodeExtensions) {
      if (extension.proseMirrorNodeName() !== node.type.name) {
        continue;
      }
      let convertedChildren: Array<UnistNode> = [];
      for (let i = 0; i < node.childCount; ++i) {
        convertedChildren = convertedChildren.concat(
          this.convertNode(node.child(i))
        );
      }
      return extension.proseMirrorNodeToMdastNodes(node, convertedChildren);
    }
    console.warn(
      "Couldn't find any way to convert ProseMirror node of type \"" +
        node.type.name +
        '" to an mdast node.'
    );
    return [];
  }
}
