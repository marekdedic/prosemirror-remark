import type { EditorView } from "prosemirror-view";

import {
  type EditorState,
  Plugin,
  PluginKey,
  type PluginView,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

import { ControlField, isCompositionKey } from "../utils/ControlField";
import { lineEnding, lineEndingGlobal } from "../utils/lineEnding";
import { positionLinkEditor } from "../utils/linkEditorPosition";
import { linkTextWritten } from "../utils/linkHrefSync";
import {
  insertedLinkRange,
  type LinkAtSelection,
  linkAtSelection,
  linkAttrs,
  type LinkAttrs,
  type TextRange,
} from "../utils/linkRange";
import {
  normaliseHref,
  normaliseTitle,
  removeLinkTransaction,
  setInsertedLinkTransaction,
  setLinkTransaction,
  stripTypedHref,
} from "../utils/linkTransaction";
import { isHistoryKey, isLinkKey } from "../utils/modShortcut";
import { focusControlInput } from "../utils/nodeViewControl";
import { setOrRemoveAttribute } from "../utils/setOrRemoveAttribute";

const openableProtocols = ["http:", "https:", "mailto:"];

// The popover of each editor, for openLinkEditor
const linkEditors = new WeakMap<EditorView, LinkEditorView>();

// The popover's plugin, whose state is the text it inserted
const linkEditorKey = new PluginKey<TextRange | null>(
  "prosemirrorRemarkLinkEditor",
);

export class LinkEditorView implements EventListenerObject, PluginView {
  private destroyed = false;
  private readonly dom: HTMLElement;
  // Whether the editor or the popover has the focus. Tracked from focus
  // events, since while focus moves between them, neither has it.
  private editorFocused: boolean;
  private readonly href: ControlField;
  // The link at the selection, as of the last render, which runs on every
  // update. Only kept up to date while the editor or the popover has the
  // focus.
  private link: LinkAtSelection = { applies: false, range: null };
  // The state the link was found in, to find it only when the document or the
  // selection changes
  private linkState: EditorState | null = null;
  private readonly open: HTMLAnchorElement;
  // Whether the plugin state holds text this popover wrote while it has had
  // the focus
  private ownsInserted = false;
  private popoverFocused = false;
  private readonly remove: HTMLButtonElement;
  // After the popover has written a link's text, the text is selected so that
  // the selection stays in the link. Returning to the editor puts the caret
  // after it instead.
  private selectedText = false;
  private readonly title: ControlField;
  private readonly view: EditorView;

  public constructor(view: EditorView) {
    this.view = view;
    this.editorFocused = view.hasFocus();
    // The editor may be in another window, e.g. an iframe
    const doc = view.dom.ownerDocument;

    this.href = new ControlField(view, {
      attributes: {
        autocomplete: "off",
        dir: "ltr",
        inputmode: "url",
        placeholder: "none",
        spellcheck: "false",
      },
      autosize: false,
      className: "prosemirror-remark-link-editor-href",
      commit: (value): boolean =>
        this.setLink({
          href: normaliseHref(value),
          title: this.currentTitle(),
        }),
      current: (): string => this.currentHref(),
      // Pasted text is trimmed whole, typed spaces are kept, as in a URL with
      // spaces, and trimmed when committed
      filterInsertion: (data, inputType): string | null =>
        lineEnding.test(data) ||
        (inputType === "insertFromPaste" && data !== data.trim())
          ? normaliseHref(data)
          : null,
      label: "URL:",
      onKeyDown: (e): void => {
        this.handleKeyDown(e, "href");
      },
      shows: (value): boolean => normaliseHref(value) === this.currentHref(),
      strip: stripTypedHref,
    });
    this.title = new ControlField(view, {
      attributes: { autocomplete: "off", dir: "auto", placeholder: "none" },
      autosize: false,
      className: "prosemirror-remark-link-editor-title",
      // The href is kept as it is, including the null of an unresolved
      // reference, which the URL field shows as empty
      commit: (value): boolean =>
        this.link.range !== null &&
        this.setLink({
          href: this.link.range.mark.attrs["href"] as string | null,
          title: normaliseTitle(value),
        }),
      // An input can't show line endings, so they're shown as spaces
      current: (): string =>
        this.currentTitle()?.replace(lineEndingGlobal, " ") ?? "",
      filterInsertion: (data): string | null =>
        lineEnding.test(data) ? data.replace(lineEndingGlobal, " ") : null,
      label: "Title:",
      onKeyDown: (e): void => {
        this.handleKeyDown(e, "title");
      },
      strip: (value): string => value,
    });

    this.open = doc.createElement("a");
    this.open.setAttribute("class", "prosemirror-remark-link-editor-open");
    this.open.setAttribute("target", "_blank");
    this.open.setAttribute("rel", "noopener noreferrer");
    this.open.textContent = "Open";

    this.remove = doc.createElement("button");
    this.remove.setAttribute("type", "button");
    this.remove.setAttribute("class", "prosemirror-remark-link-editor-remove");
    this.remove.textContent = "Remove";
    // Text the popover inserted loses only its own link, not that of an
    // identical link it merged with
    this.remove.addEventListener("click", () => {
      const { state } = this.view;
      const own = this.ownInserted();
      const inserted = own === null ? null : insertedLinkRange(state, own);
      const tr = removeLinkTransaction(
        state,
        inserted === null ? this.link : { applies: true, range: inserted },
      );
      if (tr !== null && this.view.editable) {
        this.dispatchLink(tr, false, own !== null);
      }
      this.returnFocus();
    });

    this.dom = doc.createElement("div");
    this.dom.setAttribute("class", "prosemirror-remark-link-editor");
    this.dom.setAttribute("role", "group");
    this.dom.setAttribute("aria-label", "Link");
    this.dom.hidden = true;
    this.dom.appendChild(this.href.dom);
    this.dom.appendChild(this.title.dom);
    this.dom.appendChild(this.open);
    this.dom.appendChild(this.remove);
    // Clicking a button or the link doesn't take the focus from the editor,
    // which would hide the popover before the click, as Safari doesn't focus
    // buttons
    this.dom.addEventListener("mousedown", (e) => {
      const target = e.target as Element | null;
      if (target?.closest("input") === null) {
        e.preventDefault();
      }
    });
    this.dom.addEventListener("keydown", (e) => {
      this.handlePopoverKeyDown(e);
    });
    this.dom.addEventListener("focusin", () => {
      this.popoverFocused = true;
      this.render();
    });
    this.dom.addEventListener("focusout", (e) => {
      // Switching to another window changes nothing, as the browser gives
      // the focus back to the field
      if (
        !this.dom.contains(e.relatedTarget as Node | null) &&
        doc.hasFocus()
      ) {
        this.popoverFocused = false;
        this.forget();
        this.render();
      }
    });

    // The class handles these events itself, see handleEvent
    view.dom.addEventListener("focus", this);
    view.dom.addEventListener("blur", this);
    doc.defaultView?.addEventListener("resize", this);
    doc.defaultView?.addEventListener("focus", this);
    // Scrolling any container, which doesn't bubble
    doc.addEventListener("scroll", this, { capture: true, passive: true });

    linkEditors.set(view, this);
    this.render();
  }

  public static forView(view: EditorView): LinkEditorView | undefined {
    return linkEditors.get(view);
  }

  public destroy(): void {
    const doc = this.view.dom.ownerDocument;
    this.view.dom.removeEventListener("focus", this);
    this.view.dom.removeEventListener("blur", this);
    doc.defaultView?.removeEventListener("resize", this);
    doc.defaultView?.removeEventListener("focus", this);
    doc.removeEventListener("scroll", this, true);
    if (linkEditors.get(this.view) === this) {
      linkEditors.delete(this.view);
    }
    this.destroyed = true;
    this.dom.remove();
  }

  // Focuses the URL field, with its text selected. Returns false if it can't
  // take the focus.
  public focus(): boolean {
    if (!this.view.editable) {
      return false;
    }
    const wasFocused = this.popoverFocused;
    this.popoverFocused = true;
    this.render();
    if (!focusControlInput(this.view, this.href.input)) {
      this.popoverFocused = wasFocused;
      this.render();
      return false;
    }
    if (!wasFocused) {
      this.forget();
    }
    this.href.input.select();
    return true;
  }

  // The editor's focus and blur, the window's focus and resize, and scrolling
  // in the document
  public handleEvent(e: Event): void {
    switch (e.type) {
      case "blur":
        this.editorFocused = false;
        // Focus moving into the popover mustn't hide it on the way
        if (this.dom.contains((e as FocusEvent).relatedTarget as Node | null)) {
          this.popoverFocused = true;
        }
        this.render();
        break;
      case "focus":
        if (e.currentTarget === this.view.dom) {
          this.editorFocused = true;
          if (!this.popoverFocused) {
            this.forget();
          }
          this.render();
        } else if (
          // Back from another window, or from the page around an editor in an
          // iframe, a popover that no longer has the focus has lost it for
          // good
          this.popoverFocused &&
          !this.dom.contains(this.view.root.activeElement)
        ) {
          this.popoverFocused = false;
          this.forget();
          this.render();
        }
        break;
      case "resize":
        this.render();
        break;
      // Also while a link scrolled out of sight hides the popover
      case "scroll":
        if (this.dom.hidden === false || this.link.range !== null) {
          this.render();
        }
        break;
      default:
    }
  }

  public update(): void {
    this.render();
  }

  // The editor may be put in the page after it's created
  private attach(): void {
    const parent = this.view.dom.parentNode;
    if (!this.destroyed && parent !== null && this.dom.parentNode !== parent) {
      parent.insertBefore(this.dom, this.view.dom.nextSibling);
    }
  }

  private currentHref(): string {
    return linkAttrs(this.link.range).href ?? "";
  }

  private currentTitle(): string | null {
    return linkAttrs(this.link.range).title;
  }

  // With writes, the transaction wrote the href as text, which later edits
  // keep rewriting. With forget, it changed a link other than the text the
  // popover wrote.
  private dispatchLink(
    tr: Transaction,
    writes: boolean,
    forget: boolean,
  ): void {
    if (!tr.docChanged) {
      return;
    }
    if (writes) {
      tr.setMeta(linkTextWritten, true);
      this.selectedText = true;
      const { empty, from, to } = tr.selection;
      tr.setMeta(linkEditorKey, empty ? null : { from, to });
      this.ownsInserted = !empty;
    } else if (forget) {
      tr.setMeta(linkEditorKey, null);
      this.ownsInserted = false;
    }
    this.view.dispatch(tr);
  }

  // Ends editing from the popover: the text it wrote is no longer its own.
  // The plugin state is left to the next write, so that this needn't dispatch,
  // which it may be called while updating.
  private forget(): void {
    this.selectedText = false;
    this.ownsInserted = false;
  }

  private handleKeyDown(e: KeyboardEvent, field: "href" | "title"): void {
    switch (e.key) {
      case "ArrowDown":
        if (field === "href" && !this.title.input.disabled) {
          e.preventDefault();
          this.title.input.focus();
        }
        break;
      case "ArrowUp":
        if (field === "title") {
          e.preventDefault();
          this.href.input.focus();
        }
        break;
      case "Enter":
      case "Escape":
        e.preventDefault();
        this.returnFocus();
        break;
      default:
    }
  }

  private handlePopoverKeyDown(e: KeyboardEvent): void {
    if (isCompositionKey(e)) {
      return;
    }
    if (isLinkKey(e)) {
      e.preventDefault();
      this.returnFocus();
    } else if (
      // Undo and redo go to the editor's history, not the field's own
      isHistoryKey(e) &&
      this.view.someProp("handleKeyDown", (f) => f(this.view, e)) === true
    ) {
      e.preventDefault();
    } else if (e.key === "Escape" && !e.defaultPrevented) {
      // On the buttons, which the fields' own handling doesn't cover
      e.preventDefault();
      this.returnFocus();
    }
  }

  // Whether the focused control would stop being able to take the focus
  // with the link at the selection
  private loses(active: Element | null): boolean {
    return (
      (active === this.title.input && this.link.range === null) ||
      (active === this.remove && !this.removable()) ||
      (active === this.open && this.openHref() === null)
    );
  }

  // The href "Open" links to, if any
  private openHref(): string | null {
    return openableHref(
      linkAttrs(this.link.range).href,
      this.view.dom.ownerDocument.baseURI,
    );
  }

  // The text the popover inserted, while it's its own
  private ownInserted(): TextRange | null {
    return this.ownsInserted
      ? (linkEditorKey.getState(this.view.state) ?? null)
      : null;
  }

  // Whether Remove has anything to remove, as removeLink, which removes the
  // links in a selection that isn't one link too
  private removable(): boolean {
    return removeLinkTransaction(this.view.state, this.link) !== null;
  }

  private render(): void {
    if (this.destroyed) {
      return;
    }
    this.attach();
    const { state } = this.view;
    if (!this.view.editable || (!this.popoverFocused && !this.editorFocused)) {
      // A hidden field can't keep the focus, as when the editor is made
      // read-only while one has it
      const active = this.view.root.activeElement as HTMLElement | null;
      if (active !== null && this.dom.contains(active)) {
        active.blur();
      }
      this.link = { applies: false, range: null };
      this.linkState = null;
      this.dom.hidden = true;
      return;
    }
    const changed =
      this.linkState?.doc !== state.doc ||
      !this.linkState.selection.eq(state.selection);
    if (changed) {
      this.link = linkAtSelection(state);
      this.linkState = state;
    }
    // Where no link can be set, as after an undo has moved the selection into
    // a code block, the popover has nothing to edit and gives the focus back.
    // That's done after the update, which this may be part of, so that other
    // views don't see the focus move in the middle of it.
    if (this.popoverFocused && !this.link.applies) {
      queueMicrotask(() => {
        if (!this.destroyed && this.popoverFocused && !this.link.applies) {
          this.forget();
          this.view.focus();
        }
      });
      return;
    }
    const { range } = this.link;
    this.dom.hidden = !this.popoverFocused && range === null;
    if (this.dom.hidden) {
      // The controls are rendered once it's shown again
      this.linkState = null;
      return;
    }
    // A title needs a link, which only the URL field adds. A title field
    // disabled with the focus, as by undoing the link, would drop it, and so
    // would Remove disabled or Open made inert. The focus moves to the URL
    // field first, after the update as above, and the controls change after.
    if (this.loses(this.view.root.activeElement)) {
      this.linkState = null;
      queueMicrotask(() => {
        const active = this.view.root.activeElement as HTMLElement | null;
        // Where the URL field can't take it, the focus is dropped, so that
        // this isn't repeated
        if (
          !this.destroyed &&
          this.loses(active) &&
          !focusControlInput(this.view, this.href.input)
        ) {
          active?.blur();
        }
        this.render();
      });
      return;
    }
    if (changed) {
      this.renderLinkControls();
    }
    this.href.render();
    this.title.render();
    this.title.input.disabled = range === null;
    // A link scrolled out of sight takes its popover with it, unless the
    // popover has the focus, which hiding it would drop
    if (
      !positionLinkEditor(
        this.view,
        this.dom,
        range?.from ?? state.selection.from,
      ) &&
      !this.popoverFocused
    ) {
      this.dom.hidden = true;
    }
  }

  // The controls that only depend on the link at the selection
  private renderLinkControls(): void {
    this.remove.disabled = !this.removable();
    const href = this.openHref();
    setOrRemoveAttribute(this.open, "href", href);
    setOrRemoveAttribute(
      this.open,
      "aria-disabled",
      href === null ? "true" : null,
    );
  }

  private returnFocus(): void {
    const { selection } = this.view.state;
    if (this.selectedText && !selection.empty) {
      this.view.dispatch(
        this.view.state.tr.setSelection(
          TextSelection.create(this.view.state.doc, selection.to),
        ),
      );
    }
    this.selectedText = false;
    this.view.focus();
  }

  private setLink(attrs: LinkAttrs): boolean {
    const { state } = this.view;
    const own = this.ownInserted();
    const inserted = own === null ? null : insertedLinkRange(state, own);
    if (inserted !== null) {
      const set = setInsertedLinkTransaction(state, inserted, attrs, true);
      if (set !== null) {
        this.dispatchLink(set.tr, set.writesText, false);
        return true;
      }
    }
    const set = setLinkTransaction(state, attrs, true, this.link);
    if (set === null) {
      return false;
    }
    this.dispatchLink(set.tr, set.writesText, own !== null);
    return true;
  }
}

export function hasLinkEditor(state: EditorState): boolean {
  return linkEditorKey.get(state) !== undefined;
}

// The popover, with the text it inserted as a link's href while it has the
// focus, mapped through every change. The text may merge with an identical
// link next to it, so it can't be told apart from that link's own text by the
// link range alone.
export function linkEditorPlugin(): Plugin<TextRange | null> {
  return new Plugin<TextRange | null>({
    key: linkEditorKey,
    state: {
      apply: (tr, value): TextRange | null => {
        const meta = tr.getMeta(linkEditorKey) as TextRange | null | undefined;
        if (meta !== undefined) {
          return meta;
        }
        if (value === null || !tr.docChanged) {
          return value;
        }
        const from = tr.mapping.map(value.from, 1);
        const to = tr.mapping.map(value.to, -1);
        return from < to ? { from, to } : null;
      },
      init: (): null => null,
    },
    view: (view): LinkEditorView => new LinkEditorView(view),
  });
}

// The href "Open" links to: only for schemes that can't run code in the page
function openableHref(
  href: string | null | undefined,
  base: string,
): string | null {
  if (href === null || href === undefined || href === "") {
    return null;
  }
  try {
    const url = new URL(href, base);
    return openableProtocols.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
