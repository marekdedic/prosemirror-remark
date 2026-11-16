import type { EditorView } from "prosemirror-view";

import { isRightToLeft } from "./isRightToLeft";

interface Box {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

// Moves the link editor popover above the anchor's line, or below it where
// there's no room above it in the viewport and the containers that clip it.
// It's moved by margins from where it would be without them, which needs no
// positioned container, and kept within the editor's width where it fits.
// Returns whether the anchor can be seen, rather than being scrolled out of
// the editor or a container around it.
export function positionLinkEditor(
  view: EditorView,
  dom: HTMLElement,
  anchor: number,
): boolean {
  // The popover narrows as its margin grows, so it's measured without one
  dom.style.setProperty("--prosemirror-remark-link-editor-x", "0px");
  const coords = view.coordsAtPos(anchor, 1);
  const rect = dom.getBoundingClientRect();
  const bounds = view.dom.getBoundingClientRect();
  const style = dom.ownerDocument.defaultView?.getComputedStyle(dom);
  const rtl = isRightToLeft(dom);
  const marginTop = pixels(style?.marginTop);
  const marginStart = pixels(rtl ? style?.marginRight : style?.marginLeft);
  // Distances along the line from the popover's place without margins
  const start = rtl ? rect.right + marginStart : rect.left - marginStart;
  const distance = (x: number): number => (rtl ? start - x : x - start);
  // The link's start is on the side its own text direction starts from.
  // Below a link running the other way, the popover ends at its start.
  const linkRtl = isRightToLeft(view.domAtPos(anchor).node);
  const anchorX =
    distance(linkRtl ? coords.right : coords.left) -
    (linkRtl === rtl ? 0 : rect.width);
  const x = Math.max(
    distance(rtl ? bounds.right : bounds.left),
    Math.min(anchorX, distance(rtl ? bounds.left : bounds.right) - rect.width),
  );
  // The popover isn't inside the editor, so only the containers around both
  // limit where it can be seen
  const clips = clipBoxes(view);
  const top = Math.max(
    0,
    ...clips
      .filter((clip) => clip.element !== view.dom)
      .map((clip) => clip.box.top),
  );
  const above = coords.top - rect.height;
  const y = (above >= top ? above : coords.bottom) - (rect.top - marginTop);
  dom.style.setProperty("--prosemirror-remark-link-editor-x", `${String(x)}px`);
  dom.style.setProperty("--prosemirror-remark-link-editor-y", `${String(y)}px`);
  return clips.every(
    ({ box }) =>
      coords.bottom > box.top &&
      coords.top < box.bottom &&
      coords.right >= box.left &&
      coords.left <= box.right,
  );
}

// The editor and the elements around it that clip their content, with the
// boxes their content can be seen in
function clipBoxes(
  view: EditorView,
): Array<{ box: Box; element: HTMLElement }> {
  const doc = view.dom.ownerDocument;
  const clips: Array<{ box: Box; element: HTMLElement }> = [];
  for (
    let element: HTMLElement | null = view.dom;
    element !== null && element !== doc.body;
    element = element.parentElement
  ) {
    const style = doc.defaultView?.getComputedStyle(element);
    if (style?.overflowX !== "visible" || style.overflowY !== "visible") {
      const rect = element.getBoundingClientRect();
      const left = rect.left + element.clientLeft;
      const top = rect.top + element.clientTop;
      clips.push({
        box: {
          bottom: top + element.clientHeight,
          left,
          right: left + element.clientWidth,
          top,
        },
        element,
      });
    }
  }
  return clips;
}

function pixels(value: string | undefined): number {
  const parsed = parseFloat(value ?? "");
  return Number.isNaN(parsed) ? 0 : parsed;
}
