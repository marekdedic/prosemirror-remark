import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
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

  // TODO: Move schema to a property?
  // TODO: Better error handling?
  public convert(
    unist: UnistNode,
    schema: Schema<string, string>
  ): ProseMirrorNode | null {
    const context: ConverterContext<unknown> = {};
    const rootNode = this.convertNode(unist, schema, context);
    for (const extension of this.extensionManager.syntaxExtensions()) {
      extension.postMdastToProseMirrorHook(context);
    }
    if (rootNode.length !== 1) {
      return null;
    }
    return rootNode[0];
  }

  private convertNode(
    node: UnistNode,
    schema: Schema<string, string>,
    context: ConverterContext<unknown>
  ): Array<ProseMirrorNode> {
    for (const extension of this.extensionManager.syntaxExtensions()) {
      // TODO: This is needlessly slow, a map would be better
      if (!extension.mdastNodeMatches(node)) {
        continue;
      }
      let convertedChildren: Array<ProseMirrorNode> = [];
      if (UnistToProseMirrorConverter.unistNodeIsParent(node)) {
        convertedChildren = node.children.flatMap((child) =>
          this.convertNode(child, schema, context)
        );
      }
      return extension.mdastNodeToProseMirrorNodes(
        node,
        schema,
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
