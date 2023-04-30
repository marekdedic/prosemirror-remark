import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode, Parent } from "unist";

import type { ConverterContext } from "./ConverterContext";
import type { Extension } from "./Extension";

export class MdastToProseMirrorConverter {
  private readonly extensions: Array<Extension>;

  public constructor(extensions: Array<Extension>) {
    this.extensions = extensions;
  }

  // TODO: UnistNode is a generic
  private static mdastNodeIsParent(node: UnistNode): node is Parent {
    return "children" in node;
  }

  // TODO: Move schema to a property?
  // TODO: Better error handling?
  // TODO: UnistNode is a generic
  // TODO: Specialize schema generic
  public convert(mdast: UnistNode, schema: Schema): ProseMirrorNode | null {
    const context: ConverterContext = {};
    const rootNode = this.convertNode(mdast, schema, context);
    for (const extension of this.extensions) {
      extension.postMdastToProseMirrorHook(context);
    }
    if (rootNode.length !== 1) {
      return null;
    }
    return rootNode[0];
  }

  // TODO: UnistNode is a generic
  // TODO: Specialize schema generic
  private convertNode(
    node: UnistNode,
    schema: Schema,
    context: ConverterContext
  ): Array<ProseMirrorNode> {
    for (const extension of this.extensions) {
      // TODO: This is needlessly slow, a map would be better
      if (!extension.mdastNodeMatches(node)) {
        continue;
      }
      let convertedChildren: Array<ProseMirrorNode> = [];
      if (MdastToProseMirrorConverter.mdastNodeIsParent(node)) {
        convertedChildren = node.children.flatMap((child) =>
          this.convertNode(child, schema, context)
        );
      }
      return extension.mdastNodeToProseMirrorNodes(
        node,
        convertedChildren,
        schema,
        context
      );
    }
    console.warn(
      "Couldn't find any way to convert mdast node of type \"" +
        node.type +
        '" to a ProseMirror node.'
    );
    return [];
  }
}
