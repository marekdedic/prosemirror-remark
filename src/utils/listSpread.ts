import type { List, ListContent } from "mdast";

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
