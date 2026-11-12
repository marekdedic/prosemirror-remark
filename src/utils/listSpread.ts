import type { List, ListContent } from "mdast";
import type { NodeType, Node as ProseMirrorNode } from "prosemirror-model";

import { isListItem } from "./listItemKeymap";

// A regular list item containing only an empty paragraph, which is written as
// a bare marker. A task item isn't, as it's written with its checkbox.
export function isEmptyListItem(item: ProseMirrorNode): boolean {
  return (
    isListItem(item.type) &&
    !("checked" in item.attrs) &&
    item.childCount === 1 &&
    item.firstChild?.type.name === "paragraph" &&
    item.firstChild.content.size === 0
  );
}

// A list is a node whose content is list items, so that subclasses with other
// node names are recognised too.
export function isList(type: NodeType): boolean {
  const item = type.contentMatch.defaultType;
  return item !== null && isListItem(item);
}

// Whether the list's content can't be written as tight Markdown, which would
// then be read back as a loose list. Mirrors `join` in mdast-util-to-markdown
// for the stringify options of `MarkdownExtension`.
export function isLoosenessForced(list: ProseMirrorNode): boolean {
  for (let i = 0; i < list.childCount; i++) {
    const item = list.child(i);
    for (let j = 1; j < item.childCount; j++) {
      if (needsBlankLine(item.child(j - 1), item.child(j))) {
        return true;
      }
    }
  }
  return false;
}

// CommonMark looseness: items separated by blank lines, or an item with a
// blank line between its own children.
export function isUnistListLoose(list: List): boolean {
  return (
    list.spread === true || list.children.some((item) => item.spread === true)
  );
}

// Items carry the list's looseness, so that blank lines separate a loose
// list's blocks inside its items too, not only the items.
export function itemsWithListSpread(
  items: Array<ListContent>,
  spread: boolean,
): Array<ListContent> {
  return items.map((item) => ({ ...item, spread }));
}

// Also reads `data-spread` on the items, which HTML copied from earlier
// versions has.
export function parseListSpread(dom: HTMLElement): boolean {
  return (
    dom.getAttribute("data-spread") === "true" ||
    Array.from(dom.children).some(
      (child) =>
        child.tagName.toLowerCase() === "li" &&
        child.getAttribute("data-spread") === "true",
    )
  );
}

function endsInParagraph(node: ProseMirrorNode): boolean {
  if (node.type.name === "paragraph") {
    return true;
  }
  // Written as a bare marker, which nothing can continue
  if (isEmptyListItem(node)) {
    return false;
  }
  const containsBlocks =
    node.type.name === "blockquote" ||
    isList(node.type) ||
    isListItem(node.type);
  return (
    containsBlocks && node.lastChild !== null && endsInParagraph(node.lastChild)
  );
}

function needsBlankLine(
  left: ProseMirrorNode,
  right: ProseMirrorNode,
): boolean {
  // Lazy continuation: the paragraph would join the paragraph before it
  if (right.type.name === "paragraph") {
    return endsInParagraph(left);
  }
  if (left.type.name === "paragraph") {
    // `---` under a paragraph is a setext heading underline, and a list not
    // starting at 1 can't interrupt a paragraph
    return (
      right.type.name === "horizontal_rule" ||
      (isList(right.type) &&
        typeof right.attrs["start"] === "number" &&
        right.attrs["start"] !== 1)
    );
  }
  // Two blockquotes would be one
  return left.type.name === "blockquote" && right.type.name === "blockquote";
}
