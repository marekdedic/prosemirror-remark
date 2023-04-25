import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode, Parent } from "unist";

import type { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";

export class MdastToProseMirrorConverter {
  private readonly extensions: Array<ProseMirrorRemarkExtension>;

  public constructor(extensions: Array<ProseMirrorRemarkExtension>) {
    this.extensions = extensions;
  }

  private static mdastNodeIsParent(node: UnistNode): node is Parent {
    return "children" in node;
  }

  // TODO: Move schema to a property?
  // TODO: Better error handling?
  public convert(mdast: UnistNode, schema: Schema): ProseMirrorNode | null {
    const rootNode = this.convertNode(mdast, schema);
    if (rootNode.length !== 1) {
      return null;
    }
    return rootNode[0];
  }

  private convertNode(node: UnistNode, schema: Schema): Array<ProseMirrorNode> {
    for (const extension of this.extensions) {
      if (!extension.matchingMdastNodes().includes(node.type)) {
        continue;
      }
      let convertedChildren: Array<ProseMirrorNode> = [];
      if (MdastToProseMirrorConverter.mdastNodeIsParent(node)) {
        convertedChildren = node.children.flatMap((child) =>
          this.convertNode(child, schema)
        );
      }
      return extension.mdastNodeToProseMirrorNode(
        node,
        convertedChildren,
        schema
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
