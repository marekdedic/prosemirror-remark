import type { Node as ProseMirrorNode } from "prosemirror-model";
import type {
  EditorView,
  NodeView,
  ViewMutationRecord,
} from "prosemirror-view";

import { Selection, TextSelection } from "prosemirror-state";

import {
  domAttrs,
  infoWhitespace,
  infoWhitespaceGlobal,
  nodeAttrs,
  normaliseLanguage,
} from "../utils/codeBlockAttrs";
import { isMac } from "../utils/isMac";
import { isRightToLeft } from "../utils/isRightToLeft";
import { isBackwardKey, moveFromControl } from "../utils/nodeViewControl";

export class CodeBlockView implements NodeView {
  public readonly contentDOM: HTMLElement;
  public readonly dom: HTMLElement;
  // While an IME composition is in progress, the field's text isn't committed
  // and mustn't be overwritten
  private composing = false;
  private readonly getPos: () => number | undefined;
  private readonly input: HTMLInputElement;
  private readonly languageContainer: HTMLElement;
  private node: ProseMirrorNode;
  private readonly view: EditorView;

  public constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // The editor may be in another window, e.g. an iframe
    const doc = view.dom.ownerDocument;
    this.input = doc.createElement("input");
    this.input.setAttribute("type", "text");
    this.input.setAttribute("placeholder", "none");
    this.input.setAttribute("spellcheck", "false");
    // Language names are left-to-right text even in a right-to-left editor,
    // so the field's direction follows its content
    this.input.setAttribute("dir", "auto");
    this.input.addEventListener("beforeinput", (e) => {
      if (
        !view.editable ||
        // Only the editor's history undoes changes to the language
        e.inputType === "historyUndo" ||
        e.inputType === "historyRedo"
      ) {
        e.preventDefault();
      } else if (
        (e.inputType === "insertText" || e.inputType === "insertFromPaste") &&
        e.data !== null &&
        infoWhitespace.test(e.data)
      ) {
        // A typed space does nothing, and of typed text with one (predictive
        // text, autocomplete) or pasted text only the first word is inserted
        e.preventDefault();
        this.insert(normaliseLanguage(e.data) ?? "");
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
      this.handleKeyDown(e);
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
    label.setAttribute("class", "prosemirror-remark-code-block-language-label");
    label.textContent = "Language:";

    this.languageContainer = doc.createElement("label");
    this.languageContainer.setAttribute("contenteditable", "false");
    this.languageContainer.setAttribute(
      "class",
      "prosemirror-remark-code-block-language",
    );
    this.languageContainer.appendChild(label);
    this.languageContainer.appendChild(this.input);

    this.contentDOM = doc.createElement("code");

    this.dom = doc.createElement("pre");
    this.dom.setAttribute("class", "prosemirror-remark-code-block");
    this.dom.appendChild(this.languageContainer);
    this.dom.appendChild(this.contentDOM);

    this.render();
  }

  public ignoreMutation(mutation: ViewMutationRecord): boolean {
    return this.languageContainer.contains(mutation.target);
  }

  // No instanceof checks: in an iframe, events and nodes come from another
  // window than the global classes
  public stopEvent(event: Event): boolean {
    return (
      this.languageContainer.contains(event.target as Node | null) &&
      // Undo and redo go to the editor's history, not the field's own
      !(event.type === "keydown" && isHistoryKey(event as KeyboardEvent))
    );
  }

  public update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) {
      return false;
    }
    this.node = node;
    this.render();
    return true;
  }

  private commit(): void {
    const pos = this.getPos();
    const current = normaliseLanguage(this.node.attrs["lang"] as string | null);
    if (pos === undefined || !this.view.editable) {
      this.setValue(current ?? "");
      return;
    }
    // Whitespace can arrive by drop or autocorrect, not only by typing, so it's
    // removed wherever it is, keeping the caret in place
    const { selectionStart, value } = this.input;
    const stripped = value.replace(infoWhitespaceGlobal, "");
    if (stripped !== value) {
      this.setValue(
        stripped,
        value
          .slice(0, selectionStart ?? value.length)
          .replace(infoWhitespaceGlobal, "").length,
      );
    }
    const lang = normaliseLanguage(stripped);
    if (lang !== current) {
      this.view.dispatch(
        this.view.state.tr.setNodeAttribute(pos, "lang", lang),
      );
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Safari reports the Enter that confirms a composition after the
    // composition has ended, with the key code 229, as ProseMirror checks too
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Nothing else identifies it
    if (e.isComposing || e.keyCode === 229) {
      return;
    }
    // Enter in a lone input would submit an enclosing form
    if (e.key === "Enter") {
      e.preventDefault();
    }
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
      return;
    }
    const pos = this.getPos();
    if (pos === undefined) {
      return;
    }
    const { doc } = this.view.state;
    // Built only for the keys that move, not for every key typed in the field
    const toCode = (): Selection => TextSelection.create(doc, pos + 1);
    // With nothing above, the field keeps the focus
    const above = (): Selection | null =>
      Selection.findFrom(doc.resolve(pos), -1);
    let selection: Selection | null;
    switch (e.key) {
      case "ArrowDown":
      case "Enter":
      case "Escape":
        selection = toCode();
        break;
      case "ArrowLeft":
      case "ArrowRight": {
        const { selectionEnd, selectionStart, value } = this.input;
        const atStart = selectionStart === 0 && selectionEnd === 0;
        const atEnd =
          selectionStart === value.length && selectionEnd === value.length;
        const left = e.key === "ArrowLeft";
        // Which edge of the field's text the key leaves at follows the field's
        // own direction (left-to-right for most language names), but where it
        // goes follows the tab's, as on the code side: in right-to-left text,
        // ArrowRight goes backward, to the block above.
        const atEdge = left === isRightToLeft(this.input) ? atEnd : atStart;
        if (!atEdge) {
          return;
        }
        selection = isBackwardKey(e.key, this.languageContainer)
          ? above()
          : toCode();
        break;
      }
      case "ArrowUp":
        selection = above();
        break;
      default:
        return;
    }
    moveFromControl(this.view, e, selection);
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

  private render(): void {
    const attrs = nodeAttrs(this.node);
    const { lang } = attrs;
    const dom = domAttrs(attrs);
    for (const [name, value] of Object.entries(dom.pre)) {
      setOrRemoveAttribute(this.dom, name, value);
    }
    for (const [name, value] of Object.entries(dom.code)) {
      setOrRemoveAttribute(this.contentDOM, name, value);
    }
    if (!this.composing && this.input.value !== (lang ?? "")) {
      this.setValue(lang ?? "");
    } else {
      this.resize();
    }
    this.syncEditable();
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

function isHistoryKey(event: KeyboardEvent): boolean {
  // On non-Latin layouts, the key is identified by its position, as
  // ProseMirror's keymap does
  const key = /^[\x20-\x7e]$/u.test(event.key)
    ? event.key.toLowerCase()
    : event.code.replace(/^Key/u, "").toLowerCase();
  // Mod is Cmd on macOS and Ctrl elsewhere, as in ProseMirror's keymap
  const mod = isMac()
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
  return (
    mod && !event.altKey && (key === "z" || (key === "y" && !event.shiftKey))
  );
}

function setOrRemoveAttribute(
  element: HTMLElement,
  name: string,
  value: string | null,
): void {
  if (value === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}
