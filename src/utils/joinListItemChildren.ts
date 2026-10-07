import type { Join } from "mdast-util-to-markdown";

// In a tight list item, remark-stringify joins children without a blank line,
// which changes the structure for some of them: a paragraph after a list or a
// blockquote becomes its lazy continuation, two blockquotes merge, and a
// thematic break after a paragraph turns it into a setext heading.
export const joinListItemChildren: Join = (left, right, parent) => {
  if (parent.type !== "listItem") {
    return undefined;
  }
  if (
    (right.type === "paragraph" &&
      (left.type === "list" || left.type === "blockquote")) ||
    (left.type === "blockquote" && right.type === "blockquote") ||
    (left.type === "paragraph" && right.type === "thematicBreak")
  ) {
    return 1;
  }
  return undefined;
};
