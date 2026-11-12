import type { BlockContent, DefinitionContent, List, ListContent } from "mdast";
import type { Node as ProseMirrorNode } from "prosemirror-model";

import { isList, isListItem } from "./listNodes";

// Whether the list's content can't be written as tight Markdown, which would
// then be read back as a loose list. Mirrors `join` in mdast-util-to-markdown
// for the stringify options of `MarkdownExtension`.
export function isLoosenessForced(list: ProseMirrorNode): boolean {
  for (let i = 0; i < list.childCount; i++) {
    const blocks = writtenBlocks(list.child(i));
    for (let j = 1; j < blocks.length; j++) {
      if (needsBlankLine(blocks[j - 1], blocks[j])) {
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

// Filters the converted children rather than the item's, since an extension
// may convert a node to any number of unist nodes
export function withoutEmptyParagraphs(
  item: ProseMirrorNode,
  children: Array<BlockContent | DefinitionContent>,
): Array<BlockContent | DefinitionContent> {
  return children.filter((child, index) =>
    isWritten(
      item,
      index,
      child.type === "paragraph" && child.children.length === 0,
    ),
  );
}

function endsInParagraph(node: ProseMirrorNode): boolean {
  if (node.type.name === "paragraph") {
    return true;
  }
  if (isListItem(node.type)) {
    // An item whose only content isn't written ends in a bare marker, which
    // nothing can continue
    const blocks = writtenBlocks(node);
    return blocks.length > 0 && endsInParagraph(blocks[blocks.length - 1]);
  }
  return (
    (node.type.name === "blockquote" || isList(node.type)) &&
    node.lastChild !== null &&
    endsInParagraph(node.lastChild)
  );
}

// Markdown has no way to write an empty paragraph in a list item, so they're
// left out: an item starts with at most one blank line, so writing one as
// nothing would end the item, and elsewhere it would add a blank line that
// makes the list loose. A task item's first paragraph is written with its
// checkbox, so it's kept.
function isWritten(
  item: ProseMirrorNode,
  index: number,
  isEmptyParagraph: boolean,
): boolean {
  return !isEmptyParagraph || (index === 0 && "checked" in item.attrs);
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

function writtenBlocks(item: ProseMirrorNode): Array<ProseMirrorNode> {
  const blocks: Array<ProseMirrorNode> = [];
  item.forEach((child, _offset, index) => {
    if (
      isWritten(
        item,
        index,
        child.type.name === "paragraph" && child.content.size === 0,
      )
    ) {
      blocks.push(child);
    }
  });
  return blocks;
}
