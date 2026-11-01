import type { ResolvedPos } from "prosemirror-model";
import type { Selection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { isRightToLeft } from "./isRightToLeft";

// The input in a node view's control, reached from the node's DOM through
// children with the given classes, one per level
export function findControlInput(
  view: EditorView,
  pos: number,
  ...classNames: Array<string>
): HTMLInputElement | null {
  // No instanceof checks: in an iframe, nodes come from another window than
  // the global classes
  let element: Element | undefined;
  const dom = view.nodeDOM(pos);
  if (dom !== null && dom.nodeType === dom.ELEMENT_NODE) {
    element = dom as Element;
  }
  for (const className of classNames) {
    element = Array.from(element?.children ?? []).find((child) =>
      child.classList.contains(className),
    );
  }
  return element?.querySelector("input") ?? null;
}

export function focusControlInput(
  view: EditorView,
  input: HTMLInputElement,
): boolean {
  input.focus();
  // The control may be disabled or hidden, e.g. by the app's CSS
  return view.root.activeElement === input;
}

// Whether an arrow key on a control before the content goes backward, away
// from the content: ArrowLeft in left-to-right text, ArrowRight in
// right-to-left text
export function isBackwardKey(
  key: "ArrowLeft" | "ArrowRight",
  control: Node,
): boolean {
  return (key === "ArrowLeft") !== isRightToLeft(control);
}

// Whether the caret is at the start of its textblock and the arrow key leaves
// it there: ArrowLeft in left-to-right text, ArrowRight in right-to-left text.
// In an empty textblock both would, so the direction of `side()` decides.
export function leavesTextblockStart(
  view: EditorView,
  $from: ResolvedPos,
  direction: "left" | "right",
  side: () => Node,
): boolean {
  return (
    $from.parentOffset === 0 &&
    view.endOfTextblock(direction) &&
    ($from.parent.content.size > 0 ||
      direction === (isRightToLeft(side()) ? "right" : "left"))
  );
}

export function moveFromControl(
  view: EditorView,
  event: KeyboardEvent,
  selection: Selection | null,
): void {
  // With nowhere to go, the control keeps the focus
  if (selection === null) {
    return;
  }
  event.preventDefault();
  view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
  view.focus();
}
