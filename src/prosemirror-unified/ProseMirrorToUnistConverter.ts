import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { ExtensionManager } from "./ExtensionManager";

export class ProseMirrorToUnistConverter {
  private readonly extensionManager: ExtensionManager;

  public constructor(extensionManager: ExtensionManager) {
    this.extensionManager = extensionManager;
  }

  public convert(node: ProseMirrorNode): UnistNode | null {
    const rootNode = this.convertNode(node);
    if (rootNode.length !== 1) {
      console.error(
        "Couldn't find any way to convert the root ProseMirror node."
      );
      return null;
    }
    return rootNode[0];
  }

  private convertNode(node: ProseMirrorNode): Array<UnistNode> {
    let convertedNodes: Array<UnistNode> | null = null;
    for (const extension of this.extensionManager.nodeExtensions()) {
      if (!extension.proseMirrorToUnistTest(node)) {
        continue;
      }
      let convertedChildren: Array<UnistNode> = [];
      for (let i = 0; i < node.childCount; ++i) {
        convertedChildren = convertedChildren.concat(
          this.convertNode(node.child(i))
        );
      }
      convertedNodes = extension.proseMirrorNodeToUnistNodes(
        node,
        convertedChildren
      );
    }
    if (convertedNodes === null) {
      console.warn(
        "Couldn't find any way to convert ProseMirror node of type \"" +
          node.type.name +
          '" to a unist node.'
      );
      return [];
    }
    return convertedNodes.map((convertedNode) => {
      for (const mark of node.marks) {
        for (const extension of this.extensionManager.markExtensions()) {
          if (!extension.proseMirrorToUnistTest(convertedNode, mark)) {
            continue;
          }
          convertedNode = extension.processConvertedUnistNode(
            convertedNode,
            mark
          );
        }
      }
      return convertedNode;
    });
  }
}
