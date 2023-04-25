import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

export abstract class ProseMirrorRemarkExtension {
  public abstract readonly matchingMdastNodes: Array<string>;

  public abstract mdastNodeToProseMirrorNode(node: UnistNode): ProseMirrorNode;
}
