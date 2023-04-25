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
  public convert(mdast: UnistNode, schema: Schema): ProseMirrorNode | null {
    return this.convertNode(mdast, schema);
  }

  private convertNode(node: UnistNode, schema: Schema): ProseMirrorNode | null {
    for (const extension of this.extensions) {
      if (!extension.matchingMdastNodes().includes(node.type)) {
        continue;
      }
      let convertedChildren: Array<ProseMirrorNode> = [];
      if (MdastToProseMirrorConverter.mdastNodeIsParent(node)) {
        convertedChildren = node.children
          .map((child) => this.convertNode(child, schema))
          .filter((child): child is ProseMirrorNode => child !== null);
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
    return null;
  }
}
