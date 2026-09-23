import type { Mark, Node as ProseMirrorNode } from "prosemirror-model";

export function addMarkToNodes(
  nodes: Array<ProseMirrorNode>,
  mark: Mark,
): Array<ProseMirrorNode> {
  return nodes.map((node) => node.mark(mark.addToSet(node.marks)));
}
