import type { ListContent } from "mdast";

// A spread item with a single child has nothing to separate, so remark-stringify
// would serialize it as tight. The list has to be spread instead.
export function isListSpread(
  spread: boolean,
  items: Array<ListContent>,
): boolean {
  return (
    spread ||
    items.some((item) => item.spread === true && item.children.length < 2)
  );
}
