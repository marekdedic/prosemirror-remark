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
  normaliseMeta,
  trimMetaStart,
} from "../utils/codeBlockAttrs";
import { isMac } from "../utils/isMac";
import { isRightToLeft } from "../utils/isRightToLeft";
import { isBackwardKey, moveFromControl } from "../utils/nodeViewControl";
import { CodeBlockField, type CodeBlockFieldCaret } from "./CodeBlockField";

const lineEnding = /\r\n?|\n/u;

const lineEndingGlobal = /\r\n?|\n/gu;

export class CodeBlockView implements NodeView {
  public readonly contentDOM: HTMLElement;
  public readonly dom: HTMLElement;
  private readonly getPos: () => number | undefined;
  private readonly info: HTMLElement;
  private readonly language: CodeBlockField;
  private readonly meta: CodeBlockField;
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

    this.language = new CodeBlockField(node, view, getPos, {
      attribute: "lang",
      className: "prosemirror-remark-code-block-language",
      display: (current): string => nodeAttrs(current).lang ?? "",
      // Of typed text with whitespace (predictive text, autocomplete) or
      // pasted text only the first word is inserted
      filterInsertion: (data): string | null =>
        infoWhitespace.test(data) ? (normaliseLanguage(data) ?? "") : null,
      label: "Language:",
      normalise: normaliseLanguage,
      onBeforeInput: (e): boolean => this.handleLanguageInput(e),
      onKeyDown: (e): void => {
        this.handleKeyDown(e, this.language);
      },
      strip: (value): string => value.replace(infoWhitespaceGlobal, ""),
    });
    this.meta = new CodeBlockField(node, view, getPos, {
      attribute: "meta",
      className: "prosemirror-remark-code-block-meta",
      // An input can't show line endings, so they're shown as spaces
      display: (current): string =>
        (nodeAttrs(current).meta ?? "").replace(lineEndingGlobal, " "),
      filterInsertion: (data): string | null =>
        lineEnding.test(data) ? data.replace(lineEndingGlobal, " ") : null,
      label: "Meta:",
      normalise: normaliseMeta,
      onKeyDown: (e): void => {
        this.handleKeyDown(e, this.meta);
      },
      strip: trimMetaStart,
    });

    // The editor may be in another window, e.g. an iframe
    const doc = view.dom.ownerDocument;
    this.info = doc.createElement("div");
    this.info.setAttribute("contenteditable", "false");
    this.info.setAttribute("class", "prosemirror-remark-code-block-info");
    this.info.appendChild(this.language.dom);
    this.info.appendChild(this.meta.dom);

    this.contentDOM = doc.createElement("code");

    this.dom = doc.createElement("pre");
    this.dom.setAttribute("class", "prosemirror-remark-code-block");
    this.dom.appendChild(this.info);
    this.dom.appendChild(this.contentDOM);

    this.render();
  }

  public ignoreMutation(mutation: ViewMutationRecord): boolean {
    return this.info.contains(mutation.target);
  }

  // No instanceof checks: in an iframe, events and nodes come from another
  // window than the global classes
  public stopEvent(event: Event): boolean {
    return (
      this.info.contains(event.target as Node | null) &&
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

  private handleKeyDown(e: KeyboardEvent, field: CodeBlockField): void {
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
    const { selectionEnd, selectionStart, value } = field.input;
    switch (e.key) {
      case "ArrowDown":
      case "Enter":
      case "Escape":
        moveFromControl(this.view, e, toCode());
        break;
      case "ArrowLeft":
      case "ArrowRight": {
        const atStart = selectionStart === 0 && selectionEnd === 0;
        const atEnd =
          selectionStart === value.length && selectionEnd === value.length;
        const left = e.key === "ArrowLeft";
        // Which edge of the field's text the key leaves at follows the field's
        // own direction (left-to-right for most language names), but where it
        // goes follows the tab's, as on the code side: in right-to-left text,
        // ArrowRight goes backward, towards the block above.
        const atEdge = left === isRightToLeft(field.input) ? atEnd : atStart;
        if (!atEdge) {
          return;
        }
        const backward = isBackwardKey(e.key, this.info);
        if (field === this.language) {
          if (backward) {
            moveFromControl(this.view, e, above());
          } else {
            this.moveToField(e, this.meta, e.key, toCode);
          }
        } else if (backward) {
          this.moveToField(e, this.language, e.key, above);
        } else {
          moveFromControl(this.view, e, toCode());
        }
        break;
      }
      case "ArrowUp":
        moveFromControl(this.view, e, above());
        break;
      case "Backspace":
        if (field === this.meta && selectionStart === 0 && selectionEnd === 0) {
          this.moveToField(e, this.language, "end", () => null);
        }
        break;
      default:
    }
  }

  // A typed space at the end of the language moves on to the meta, as in the
  // info string. Any other space does nothing, also without a language, where
  // a meta wouldn't be saved.
  private handleLanguageInput(e: InputEvent): boolean {
    const { selectionEnd, selectionStart, value } = this.language.input;
    if (
      e.inputType !== "insertText" ||
      e.data !== " " ||
      value === "" ||
      selectionStart !== value.length ||
      selectionEnd !== value.length
    ) {
      return false;
    }
    e.preventDefault();
    this.meta.focus("start");
    return true;
  }

  // A field the app hides can't take the focus, which then goes on past it
  private moveToField(
    e: KeyboardEvent,
    field: CodeBlockField,
    caret: CodeBlockFieldCaret,
    past: () => Selection | null,
  ): void {
    if (field.focus(caret)) {
      e.preventDefault();
    } else {
      moveFromControl(this.view, e, past());
    }
  }

  private render(): void {
    const dom = domAttrs(nodeAttrs(this.node));
    for (const [name, value] of Object.entries(dom.pre)) {
      setOrRemoveAttribute(this.dom, name, value);
    }
    for (const [name, value] of Object.entries(dom.code)) {
      setOrRemoveAttribute(this.contentDOM, name, value);
    }
    this.language.render(this.node);
    this.meta.render(this.node);
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
