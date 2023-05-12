import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode, Parent } from "unist";

import type { ConverterContext } from "./ConverterContext";
import type { ExtensionManager } from "./ExtensionManager";

export class UnistToProseMirrorConverter {
  private readonly extensionManager: ExtensionManager;

  public constructor(extensionManager: ExtensionManager) {
    this.extensionManager = extensionManager;
  }

  private static unistNodeIsParent(node: UnistNode): node is Parent {
    return "children" in node;
  }

  public convert(unist: UnistNode): ProseMirrorNode | null {
    const context: ConverterContext<unknown> = {};
    const rootNode = this.convertNode(unist, context);
    for (const extension of this.extensionManager.syntaxExtensions()) {
      extension.postUnistToProseMirrorHook(context);
    }
    if (rootNode.length !== 1) {
      console.error("Couldn't find any way to convert the root unist node.");
      return null;
    }
    return rootNode[0];
  }

  private convertNode(
    node: UnistNode,
    context: ConverterContext<unknown>
  ): Array<ProseMirrorNode> {
    for (const extension of this.extensionManager.syntaxExtensions()) {
      if (!extension.unistToProseMirrorTest(node)) {
        continue;
      }
      let convertedChildren: Array<ProseMirrorNode> = [];
      if (UnistToProseMirrorConverter.unistNodeIsParent(node)) {
        convertedChildren = node.children.flatMap((child) =>
          this.convertNode(child, context)
        );
      }
      return extension.unistNodeToProseMirrorNodes(
        node,
        convertedChildren,
        context
      );
    }
    console.warn(
      "Couldn't find any way to convert unist node of type \"" +
        node.type +
        '" to a ProseMirror node.'
    );
    return [];
  }
}
