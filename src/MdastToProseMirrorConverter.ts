import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

export class MdastToProseMirrorConverter {
  public convert(mdast: UnistNode): ProseMirrorNode {
    return this.convertNode(mdast);
  }

  private convertNode(node: UnistNode): ProseMirrorNode {}
}
