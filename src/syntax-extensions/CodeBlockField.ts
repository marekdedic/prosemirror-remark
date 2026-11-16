import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

import { type CodeBlockAttrs, nodeAttrs } from "../utils/codeBlockAttrs";
import { ControlField } from "../utils/ControlField";
import { isRightToLeft } from "../utils/isRightToLeft";
import { focusControlInput } from "../utils/nodeViewControl";

// Where the caret goes in a field that gets the focus: the start or the end of
// its text, or for an arrow key, the field's edge on the side the key comes
// from, which depends on the field's own direction
export type CodeBlockFieldCaret = "ArrowLeft" | "ArrowRight" | "end" | "start";

export interface CodeBlockFieldOptions {
  attribute: keyof CodeBlockAttrs;
  className: string;
  // The value the field shows for the node
  display(node: ProseMirrorNode): string;
  filterInsertion(data: string): string | null;
  label: string;
  normalise(value: string): string | null;
  onBeforeInput?(event: InputEvent): boolean;
  // Only called for keys without a modifier, outside of a composition
  onKeyDown(event: KeyboardEvent): void;
  strip(value: string): string;
}

export class CodeBlockField {
  public readonly dom: HTMLElement;
  public readonly input: HTMLInputElement;
  private readonly field: ControlField;
  private node: ProseMirrorNode;
  private readonly view: EditorView;

  public constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    options: CodeBlockFieldOptions,
  ) {
    this.node = node;
    this.view = view;
    this.field = new ControlField(view, {
      attributes: { dir: "auto", placeholder: "none", spellcheck: "false" },
      autosize: true,
      className: options.className,
      commit: (value): boolean => {
        const pos = getPos();
        if (pos === undefined) {
          return false;
        }
        const { attribute } = options;
        const updated = options.normalise(value);
        if (updated !== nodeAttrs(this.node)[attribute]) {
          view.dispatch(
            view.state.tr.setNodeAttribute(pos, attribute, updated),
          );
        }
        return true;
      },
      current: (): string => options.display(this.node),
      filterInsertion: (data): string | null => options.filterInsertion(data),
      label: options.label,
      onBeforeInput: (e): boolean => options.onBeforeInput?.(e) === true,
      onKeyDown: (e): void => {
        options.onKeyDown(e);
      },
      strip: (value): string => options.strip(value),
    });
    this.dom = this.field.dom;
    this.input = this.field.input;
  }

  public focus(caret: CodeBlockFieldCaret): boolean {
    return focusCodeBlockField(this.view, this.input, caret);
  }

  public render(node: ProseMirrorNode): void {
    this.node = node;
    this.field.render();
  }
}

// Returns whether the field took the focus
export function focusCodeBlockField(
  view: EditorView,
  input: HTMLInputElement,
  caret: CodeBlockFieldCaret,
): boolean {
  if (!focusControlInput(view, input)) {
    return false;
  }
  const atStart =
    caret === "ArrowLeft" || caret === "ArrowRight"
      ? (caret === "ArrowRight") !== isRightToLeft(input)
      : caret === "start";
  const offset = atStart ? 0 : input.value.length;
  input.setSelectionRange(offset, offset);
  return true;
}
