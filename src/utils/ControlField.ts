import type { EditorView } from "prosemirror-view";

export interface ControlFieldOptions {
  // Extra attributes for the input, such as placeholder or dir
  attributes: Record<string, string>;
  // Whether the input is sized to its value
  autosize: boolean;
  className: string;
  // Called with the field's value when it differs from current(). Returns
  // false if the edit can't be committed, so that the field is reset.
  commit(value: string): boolean;
  // The value the field shows for the document as it is
  current(): string;
  filterInsertion(data: string, inputType: string): string | null;
  label: string;
  onBeforeInput?(event: InputEvent): boolean;
  // Only called for keys without a modifier, outside of a composition
  onKeyDown(event: KeyboardEvent): void;
  // Whether the field's value already stands for current(), e.g. differing
  // only in what's normalised away, so that it isn't overwritten while typed
  shows?(value: string): boolean;
  strip(value: string): string;
}

export class ControlField {
  public readonly dom: HTMLElement;
  public readonly input: HTMLInputElement;
  // While an IME composition is in progress, the field's text isn't committed
  // and mustn't be overwritten
  private composing = false;
  private readonly options: ControlFieldOptions;
  private readonly view: EditorView;

  public constructor(view: EditorView, options: ControlFieldOptions) {
    this.view = view;
    this.options = options;

    // The editor may be in another window, e.g. an iframe
    const doc = view.dom.ownerDocument;
    this.input = doc.createElement("input");
    this.input.setAttribute("type", "text");
    for (const [name, value] of Object.entries(options.attributes)) {
      this.input.setAttribute(name, value);
    }
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
        const replacement = options.filterInsertion(e.data, e.inputType);
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
      if (isCompositionKey(e)) {
        return;
      }
      // Enter in a lone input would submit an enclosing form
      if (e.key === "Enter") {
        e.preventDefault();
      }
      // Shift-Enter does what Enter does, rather than nothing
      if (
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        (!e.shiftKey || e.key === "Enter")
      ) {
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
    // Views aren't updated when only the editor's editable prop changes
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

  public render(): void {
    const value = this.options.current();
    if (
      !this.composing &&
      this.input.value !== value &&
      this.options.shows?.(this.input.value) !== true
    ) {
      this.setValue(value);
    } else {
      this.resize();
    }
    this.syncEditable();
  }

  private commit(): void {
    const current = this.options.current();
    if (!this.view.editable) {
      this.setValue(current);
      return;
    }
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
    if (stripped !== current && !this.options.commit(stripped)) {
      this.setValue(current);
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
    if (this.options.autosize) {
      this.input.size = Math.max(
        this.input.value.length,
        this.input.placeholder.length,
      );
    }
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

// Whether the key is part of an IME composition. Safari reports the Enter that
// confirms a composition after the composition has ended, with the key code
// 229, as ProseMirror checks too.
export function isCompositionKey(e: KeyboardEvent): boolean {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Nothing else identifies it
  return e.isComposing || e.keyCode === 229;
}
