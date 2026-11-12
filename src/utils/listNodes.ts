import type { NodeType } from "prosemirror-model";

// Both are called for many nodes on every edit, so they're cached per type
const listItemTypes = new WeakMap<NodeType, boolean>();
const listTypes = new WeakMap<NodeType, boolean>();

// A list is a node whose content is list items, so that subclasses with other
// node names are recognised too.
export function isList(type: NodeType): boolean {
  let result = listTypes.get(type);
  if (result === undefined) {
    const item = type.contentMatch.defaultType;
    result = item !== null && isListItem(item);
    listTypes.set(type, result);
  }
  return result;
}

export function isListItem(type: NodeType): boolean {
  let result = listItemTypes.get(type);
  if (result === undefined) {
    result = type.spec.group?.split(" ").includes("list_item") === true;
    listItemTypes.set(type, result);
  }
  return result;
}
