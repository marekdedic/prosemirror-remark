import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";

export class MdastToProseMirrorConverter {
  private readonly extensions: Array<ProseMirrorRemarkExtension>;

  public constructor(extensions: Array<ProseMirrorRemarkExtension>) {
    this.extensions = extensions;
  }

  public convert(mdast: UnistNode): ProseMirrorNode | null {
    return this.convertNode(mdast);
  }

  private convertNode(node: UnistNode): ProseMirrorNode | null {
    for (const extension of this.extensions) {
      if (!extension.matchingMdastNodes.includes(node.type)) {
        continue;
      }
      return extension.mdastNodeToProseMirrorNode(node);
    }
    console.warn(
      "Couldn't find any way to convert mdast node of type \"" +
        node.type +
        '" to a ProseMirror node.'
    );
    return null;
  }
}
