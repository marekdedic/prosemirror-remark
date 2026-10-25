export function isRightToLeft(node: Node): boolean {
  const element =
    node.nodeType === node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return (
    element !== null &&
    element.ownerDocument.defaultView?.getComputedStyle(element).direction ===
      "rtl"
  );
}
