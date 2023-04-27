import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { MarkExtension } from "./MarkExtension";
import type { NodeExtension } from "./NodeExtension";

export class ProseMirrorToMdastConverter {
  private readonly nodeExtensions: Array<NodeExtension>;
  private readonly markExtensions: Array<MarkExtension>;

  public constructor(
    nodeExtensions: Array<NodeExtension>,
    markExtensions: Array<MarkExtension>
  ) {
    this.nodeExtensions = nodeExtensions;
    this.markExtensions = markExtensions;
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
    let convertedNodes: Array<UnistNode> | null = null;
    for (const extension of this.nodeExtensions) {
      // TODO: This is needlessly slow, a map would be better
      if (extension.proseMirrorNodeName() !== node.type.name) {
        continue;
      }
      let convertedChildren: Array<UnistNode> = [];
      for (let i = 0; i < node.childCount; ++i) {
        convertedChildren = convertedChildren.concat(
          this.convertNode(node.child(i))
        );
      }
      convertedNodes = extension.proseMirrorNodeToMdastNodes(
        node,
        convertedChildren
      );
    }
    if (convertedNodes === null) {
      console.warn(
        "Couldn't find any way to convert ProseMirror node of type \"" +
          node.type.name +
          '" to an mdast node.'
      );
      return [];
    }
    return convertedNodes.map((convertedNode) => {
      for (const mark of node.marks) {
        for (const extension of this.markExtensions) {
          // TODO: This is needlessly slow, a map would be better
          if (extension.proseMirrorMarkName() !== mark.type.name) {
            continue;
          }
          convertedNode = extension.modifyMdastNode(convertedNode, mark);
        }
      }
      return convertedNode;
    });
  }
}
