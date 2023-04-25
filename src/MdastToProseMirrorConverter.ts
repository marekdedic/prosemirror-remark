import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";

export class MdastToProseMirrorConverter {
  private readonly extensions: Array<ProseMirrorRemarkExtension>;

  public constructor(extensions: Array<ProseMirrorRemarkExtension>) {
    this.extensions = extensions;
  }

  public convert(mdast: UnistNode, schema: Schema): ProseMirrorNode | null {
    return this.convertNode(mdast, schema);
  }

  private convertNode(node: UnistNode, schema: Schema): ProseMirrorNode | null {
    for (const extension of this.extensions) {
      if (!extension.matchingMdastNodes().includes(node.type)) {
        continue;
      }
      return extension.mdastNodeToProseMirrorNode(node, schema);
    }
    console.warn(
      "Couldn't find any way to convert mdast node of type \"" +
        node.type +
        '" to a ProseMirror node.'
    );
    return null;
  }
}
