import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

import { type CodeBlockAttrs, nodeAttrs } from "../utils/codeBlockAttrs";
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
  // What to insert instead of typed or pasted text, or null to insert it as
  // it is
  filterInsertion(data: string): string | null;
  label: string;
  normalise(value: string): string | null;
  // Returns whether it handled the event
  onBeforeInput?(event: InputEvent): boolean;
  // Only called for keys without a modifier, outside of a composition
  onKeyDown(event: KeyboardEvent): void;
  // Removes what the field can't hold from its value
  strip(value: string): string;
}

// One field in the code block's tab, editing one attribute
export class CodeBlockField {
  public readonly dom: HTMLElement;
  public readonly input: HTMLInputElement;
  // While an IME composition is in progress, the field's text isn't committed
  // and mustn't be overwritten
  private composing = false;
  private readonly getPos: () => number | undefined;
  private node: ProseMirrorNode;
  private readonly options: CodeBlockFieldOptions;
  private readonly view: EditorView;

  public constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    options: CodeBlockFieldOptions,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.options = options;

    // The editor may be in another window, e.g. an iframe
    const doc = view.dom.ownerDocument;
    this.input = doc.createElement("input");
    this.input.setAttribute("type", "text");
    this.input.setAttribute("placeholder", "none");
    this.input.setAttribute("spellcheck", "false");
    // The field's direction follows its content: language names are
    // left-to-right text even in a right-to-left editor, while a meta may be
    // text in any language
    this.input.setAttribute("dir", "auto");
    this.input.addEventListener("beforeinput", (e) => {
      if (
        !view.editable ||
        // Only the editor's history undoes changes to the field
        e.inputType === "historyUndo" ||
        e.inputType === "historyRedo"
      ) {
        e.preventDefault();
      } else if (
        options.onBeforeInput?.(e) !== true &&
        (e.inputType === "insertText" || e.inputType === "insertFromPaste") &&
        e.data !== null
      ) {
        // Typed text (predictive text, autocomplete) or pasted text the field
        // can't hold as it is is replaced at the caret
        const replacement = options.filterInsertion(e.data);
        if (replacement !== null) {
          e.preventDefault();
          this.insert(replacement);
        }
      }
    });
    this.input.addEventListener("input", (e) => {
      this.resize();
      if (!e.isComposing) {
        this.commit();
      }
    });
    this.input.addEventListener("compositionstart", () => {
      this.composing = true;
    });
    this.input.addEventListener("compositionend", () => {
      this.composing = false;
      this.commit();
    });
    this.input.addEventListener("keydown", (e) => {
      // Safari reports the Enter that confirms a composition after the
      // composition has ended, with the key code 229, as ProseMirror checks
      // too
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- Nothing else identifies it
      if (e.isComposing || e.keyCode === 229) {
        return;
      }
      // Enter in a lone input would submit an enclosing form
      if (e.key === "Enter") {
        e.preventDefault();
      }
      if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        options.onKeyDown(e);
      }
    });
    this.input.addEventListener("blur", () => {
      // Some input methods end a composition on blur without compositionend,
      // which would otherwise stop the field from syncing for good
      if (this.composing) {
        this.composing = false;
        this.commit();
      }
    });
    // The node view isn't updated when only the editor's editable prop
    // changes, so the field also catches up when it gets focus, before it can
    // be typed into or announced
    this.input.addEventListener("focus", () => {
      this.syncEditable();
    });

    const label = doc.createElement("span");
    label.setAttribute("class", `${options.className}-label`);
    label.textContent = options.label;

    this.dom = doc.createElement("label");
    this.dom.setAttribute("class", options.className);
    this.dom.appendChild(label);
    this.dom.appendChild(this.input);
  }

  public focus(caret: CodeBlockFieldCaret): boolean {
    return focusCodeBlockField(this.view, this.input, caret);
  }

  public render(node: ProseMirrorNode): void {
    this.node = node;
    const value = this.options.display(node);
    if (!this.composing && this.input.value !== value) {
      this.setValue(value);
    } else {
      this.resize();
    }
    this.syncEditable();
  }

  private commit(): void {
    const pos = this.getPos();
    const current = this.options.display(this.node);
    if (pos === undefined || !this.view.editable) {
      this.setValue(current);
      return;
    }
    // What the field can't hold can arrive by drop or autocorrect, not only by
    // typing, so it's removed wherever it is, keeping the caret in place
    const { selectionStart, value } = this.input;
    const stripped = this.options.strip(value);
    if (stripped !== value) {
      this.setValue(
        stripped,
        this.options.strip(value.slice(0, selectionStart ?? value.length))
          .length,
      );
    }
    // A value the field shows differently from how it's stored (a meta with
    // line endings) is only replaced when it's edited
    if (stripped === current) {
      return;
    }
    const { attribute } = this.options;
    const updated = this.options.normalise(stripped);
    if (updated !== nodeAttrs(this.node)[attribute]) {
      this.view.dispatch(
        this.view.state.tr.setNodeAttribute(pos, attribute, updated),
      );
    }
  }

  private insert(text: string): void {
    if (text === "") {
      return;
    }
    this.input.setRangeText(
      text,
      this.input.selectionStart ?? this.input.value.length,
      this.input.selectionEnd ?? this.input.value.length,
      "end",
    );
    this.resize();
    this.commit();
  }

  private resize(): void {
    this.input.size = Math.max(
      this.input.value.length,
      this.input.placeholder.length,
    );
  }

  private setValue(value: string, caret?: number): void {
    this.input.value = value;
    if (caret !== undefined) {
      this.input.setSelectionRange(caret, caret);
    }
    this.resize();
  }

  private syncEditable(): void {
    this.input.readOnly = !this.view.editable;
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
