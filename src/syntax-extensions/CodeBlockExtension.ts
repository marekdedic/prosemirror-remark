import type { Code, Root, Text } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  NodeType,
  Node as ProseMirrorNode,
  ResolvedPos,
  Schema,
} from "prosemirror-model";
import type {
  EditorView,
  NodeView,
  NodeViewConstructor,
  ViewMutationRecord,
} from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import { chainCommands, setBlockType } from "prosemirror-commands";
import { InputRule } from "prosemirror-inputrules";
import {
  type Command,
  type EditorState,
  NodeSelection,
  Selection,
  TextSelection,
  type Transaction,
} from "prosemirror-state";
import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";
import remarkParse from "remark-parse";
import { type Processor, unified } from "unified";

import { buildUnifiedExtension } from "../utils/buildUnifiedExtension";
import { isMac } from "../utils/isMac";
import { TextExtension } from "./TextExtension";

// The characters CommonMark splits an info string at
const infoWhitespaceCharacter = "[ \\t\\n\\r]";
const infoWhitespace = new RegExp(infoWhitespaceCharacter, "u");
const infoWhitespaceGlobal = new RegExp(infoWhitespaceCharacter, "gu");
// A line that starts like an opening fence. Whether it is one is up to the
// parser, see parseFenceLine.
const fenceStart = /^ {0,3}(?:`{3,}|~{3,})/u;
// A fence followed by at most one word, which is all that can be typed: the
// first space already converts the paragraph. Text with a space or tab after
// the fence is prose, even if CommonMark would read it as a fence with a meta.
const typeableFenceLine = new RegExp(`${fenceStart.source}[^ \\t]*$`, "u");
// A typed space, which browsers may turn into a non-breaking one when input is
// read back from the DOM. Not \s, which would match the line ending Enter is
// passed to the input rules as.
const typedSpace = "[ \\u00a0]";
// A fence followed by a language and a space, which converts the paragraph
const fenceOnSpace = new RegExp(
  `${fenceStart.source}[^ \\t\\u00a0]*${typedSpace}$`,
  "u",
);
// Anything typed into a paragraph that starts like a fence, including Enter
const fenceLineInput = new RegExp(`${fenceStart.source}.*\\n?$`, "u");
// The character references CommonMark decodes in an info string
const unsafeInfoStringAmpersand = {
  after: "#?[\\dA-Za-z]+;",
  character: "&",
  inConstruct: [
    "codeFencedLangGraveAccent" as const,
    "codeFencedLangTilde" as const,
    "codeFencedMetaGraveAccent" as const,
    "codeFencedMetaTilde" as const,
  ],
};

let markdownParser: Processor<Root> | undefined = undefined;

interface CodeBlockAttrs {
  lang: string | null;
  meta: string | null;
}

class CodeBlockView implements NodeView {
  public readonly contentDOM: HTMLElement;
  public readonly dom: HTMLElement;
  // The attributes the field last wrote. An update with other attributes comes
  // from elsewhere and resets the remembered meta.
  private committed: CodeBlockAttrs | null = null;
  // While an IME composition is in progress, the field's text isn't committed
  // and mustn't be overwritten
  private composing = false;
  private readonly getPos: () => number | undefined;
  private readonly input: HTMLInputElement;
  private readonly languageContainer: HTMLElement;
  private node: ProseMirrorNode;
  // The meta removed together with the language while the field is being
  // edited, restored if a language is typed again before the field is left.
  private removedMeta: string | null = null;
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
        e.inputType === "insertText" &&
        e.data !== null &&
        infoWhitespace.test(e.data)
      ) {
        // A typed space does nothing, and of text with one (predictive text,
        // autocomplete) only the first word is inserted, as with paste
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
    this.input.addEventListener("paste", (e) => {
      this.paste(e);
    });
    this.input.addEventListener("keydown", (e) => {
      this.handleKeyDown(e);
    });
    this.input.addEventListener("blur", () => {
      // Some input methods end a composition on blur without compositionend,
      // which would otherwise stop the field from syncing for good. It's
      // committed before the remembered meta is forgotten, so it can restore it.
      if (this.composing) {
        this.composing = false;
        this.commit();
      }
      this.removedMeta = null;
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
    if (this.removedMeta !== null) {
      const attrs = nodeAttrs(node);
      if (
        attrs.lang !== this.committed?.lang ||
        attrs.meta !== this.committed.meta ||
        // The field never changes the code, so this is another block or an
        // edit from elsewhere
        !node.content.eq(this.node.content)
      ) {
        this.removedMeta = null;
      }
    }
    this.node = node;
    this.render();
    return true;
  }

  private commit(): void {
    const pos = this.getPos();
    const current = nodeAttrs(this.node).lang;
    if (pos === undefined || !this.view.editable) {
      this.input.value = current ?? "";
      this.resize();
      return;
    }
    // Whitespace can arrive by drop or autocorrect, not only by typing, so it's
    // removed wherever it is, keeping the caret in place
    const { selectionStart, value } = this.input;
    const stripped = value.replace(infoWhitespaceGlobal, "");
    if (stripped !== value) {
      const caret = value
        .slice(0, selectionStart ?? value.length)
        .replace(infoWhitespaceGlobal, "").length;
      this.input.value = stripped;
      this.input.setSelectionRange(caret, caret);
      this.resize();
    }
    const lang = normaliseLanguage(stripped);
    if (lang === current) {
      return;
    }
    const { meta } = nodeAttrs(this.node);
    if (lang === null) {
      this.removedMeta = meta;
    }
    this.committed = codeBlockAttrs(lang, meta ?? this.removedMeta);
    this.view.dispatch(setLanguageAt(this.view.state.tr, pos, this.committed));
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
    const { selectionEnd, selectionStart, value } = this.input;
    const atStart = selectionStart === 0 && selectionEnd === 0;
    const atEnd =
      selectionStart === value.length && selectionEnd === value.length;
    const toCode = TextSelection.create(doc, pos + 1);
    // With nothing above, the field keeps the focus
    const above = Selection.findFrom(doc.resolve(pos), -1);
    let selection: Selection | null;
    switch (e.key) {
      case "ArrowDown":
      case "Enter":
      case "Escape":
        selection = toCode;
        break;
      case "ArrowLeft":
      case "ArrowRight": {
        if (!atStart && !atEnd) {
          return;
        }
        const left = e.key === "ArrowLeft";
        // Which edge of the field's text the key leaves at follows the field's
        // own direction (left-to-right for most language names), but where it
        // goes follows the tab's, as on the code side: in right-to-left text,
        // ArrowRight goes backward, to the block above.
        const atEdge = left === isRightToLeft(this.input) ? atEnd : atStart;
        if (!atEdge) {
          return;
        }
        const backward = left !== isRightToLeft(this.languageContainer);
        selection = backward ? above : toCode;
        break;
      }
      case "ArrowUp":
        selection = above;
        break;
      default:
        return;
    }
    if (selection === null) {
      return;
    }
    e.preventDefault();
    this.view.dispatch(
      this.view.state.tr.setSelection(selection).scrollIntoView(),
    );
    this.view.focus();
  }

  // Inserts text at the caret, replacing the selection, as typing would
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

  private paste(e: ClipboardEvent): void {
    // Insert only the pasted text up to its first whitespace, leaving the rest
    // of the field and the caret alone
    e.preventDefault();
    if (this.view.editable) {
      this.insert(
        normaliseLanguage(e.clipboardData?.getData("text/plain")) ?? "",
      );
    }
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
      this.input.value = lang ?? "";
    }
    this.resize();
    this.syncEditable();
  }

  private resize(): void {
    this.input.size = Math.max(
      this.input.value.length,
      this.input.placeholder.length,
    );
  }

  private syncEditable(): void {
    this.input.readOnly = !this.view.editable;
  }
}

export class CodeBlockExtension extends NodeExtension<Code> {
  private static fenceOnEnter(nodeType: NodeType): Command {
    return (state, dispatch): boolean => {
      const { $from, empty } = state.selection;
      const attrs = empty ? fenceParagraphAttrs($from, nodeType) : null;
      if (attrs === null) {
        return false;
      }
      if (dispatch) {
        const tr = state.tr.replaceWith(
          $from.before(),
          $from.after(),
          nodeType.create(attrs),
        );
        dispatch(
          tr
            .setSelection(TextSelection.create(tr.doc, $from.before() + 1))
            .scrollIntoView(),
        );
      }
      return true;
    };
  }

  private static focusLanguage(direction: "left" | "right" | "up"): Command {
    return (state, dispatch, view): boolean => {
      const { $from, empty } = state.selection;
      if (
        view === undefined ||
        !view.editable ||
        !empty ||
        $from.parent.type.name !== "code_block"
      ) {
        return false;
      }
      const atEdge =
        direction === "up"
          ? // The first line of the code, and its first row if it wraps
            !$from.parent.textBetween(0, $from.parentOffset).includes("\n") &&
            view.endOfTextblock("up")
          : // At the start, the key that leaves the code on its side: ArrowLeft
            // in left-to-right text, ArrowRight in right-to-left text. In an
            // empty block both would, so the code's direction decides.
            $from.parentOffset === 0 &&
            view.endOfTextblock(direction) &&
            ($from.parent.content.size > 0 ||
              direction ===
                (isRightToLeft(view.domAtPos($from.pos).node)
                  ? "right"
                  : "left"));
      if (!atEdge) {
        return false;
      }
      // No instanceof checks: in an iframe, nodes come from another window
      // than the global classes
      const dom = view.nodeDOM($from.before());
      const input =
        dom !== null && dom.nodeType === dom.ELEMENT_NODE
          ? Array.from((dom as Element).children)
              .find((child) =>
                child.classList.contains(
                  "prosemirror-remark-code-block-language",
                ),
              )
              ?.querySelector("input")
          : null;
      if (input === null || input === undefined) {
        return false;
      }
      if (dispatch) {
        input.focus();
        // The field may be hidden, e.g. by the app's CSS
        if (view.root.activeElement !== input) {
          return false;
        }
        input.setSelectionRange(input.value.length, input.value.length);
      }
      return true;
    };
  }

  private static liftOutOfCodeBlock() {
    return (
      state: EditorState,
      dispatch?: (tr: Transaction) => void,
    ): boolean => {
      const { $from, $to } = state.selection;
      if (
        // Mustn't be a complex selection
        !$from.sameParent($to) ||
        // Must be in a code block
        $from.parent.type.name !== "code_block" ||
        // Must be at the end of the code block
        $from.parentOffset !== $from.parent.content.size ||
        // There must already be a preceding empty line
        !$from.parent.textBetween(0, $from.parentOffset).endsWith("\n\n")
      ) {
        return false;
      }
      if (dispatch) {
        const tr = state.tr;
        dispatch(
          tr
            // Delete the preceding empty line
            .deleteRange($from.pos - 2, $from.pos)
            // Insert empty paragraph
            .insert(
              $from.pos - 1,
              tr.doc.type.schema.nodes["paragraph"].create(),
            )
            // Put the cursor into the empty paragraph
            .setSelection(Selection.near(tr.doc.resolve($from.pos), 1))
            .scrollIntoView(),
        );
      }
      return true;
    };
  }

  public override dependencies(): Array<Extension> {
    return [new TextExtension()];
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    const nodeType = proseMirrorSchema.nodes[this.proseMirrorNodeName()];
    return [
      // Like textblockTypeInputRule, but only for a whole paragraph that is a
      // fence line, as with Enter
      new InputRule(fenceOnSpace, (state, match, start, end) => {
        // Typed text of any length (e.g. "js " from autocomplete) is read as
        // part of the line
        const attrs =
          typedIntoParagraph(state, match, start, end) === null
            ? null
            : fenceParagraphAttrs(
                state.doc.resolve(end),
                nodeType,
                match[0].slice(0, -1),
              );
        if (attrs === null) {
          return null;
        }
        return state.tr
          .delete(start, end)
          .setBlockType(start, start, nodeType, attrs);
      }),
      // While a paragraph is a fence line, typed text is inserted as it is, so
      // that the mark input rules after this one don't strip delimiters from
      // the language
      new InputRule(
        fenceLineInput,
        (state, match, start, end) => {
          const $end = state.doc.resolve(end);
          const typed = typedIntoParagraph(state, match, start, end);
          if (typed === null) {
            return null;
          }
          if (typed === "\n") {
            // Enter only needs guarding where fenceOnEnter converts the fence,
            // so this is the same check. Prosemirror-unified passes Enter to
            // the input rules as a line ending and then runs the keymap
            // anyway, which converts the fence; an empty transaction keeps
            // the mark rules from running first.
            return fenceParagraphAttrs(
              $end,
              nodeType,
              match[0].slice(0, -1),
            ) === null
              ? null
              : state.tr;
          }
          return canBecomeCodeBlock($end, nodeType) &&
            parseFenceLine(match[0]) !== null
            ? state.tr.insertText(typed, end)
            : null;
        },
        { undoable: false },
      ),
      // Like textblockTypeInputRule, but only in a paragraph, as with fences.
      // Text after the spaces becomes the code, as in CommonMark.
      new InputRule(
        new RegExp(`^${typedSpace}{4}$`, "u"),
        (state, match, start, end) =>
          typedIntoParagraph(state, match, start, end) !== null &&
          canBecomeCodeBlock(state.doc.resolve(start), nodeType)
            ? state.tr.delete(start, end).setBlockType(start, start, nodeType)
            : null,
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    const nodeType = proseMirrorSchema.nodes[this.proseMirrorNodeName()];
    return {
      ArrowLeft: CodeBlockExtension.focusLanguage("left"),
      ArrowRight: CodeBlockExtension.focusLanguage("right"),
      ArrowUp: CodeBlockExtension.focusLanguage("up"),
      Enter: chainCommands(
        CodeBlockExtension.fenceOnEnter(nodeType),
        CodeBlockExtension.liftOutOfCodeBlock(),
      ),
      "Shift-Mod-\\": setBlockType(nodeType),
    };
  }

  public override proseMirrorNodeName(): string {
    return "code_block";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      attrs: { lang: { default: null }, meta: { default: null } },
      code: true,
      content: "text*",
      defining: true,
      group: "block",
      marks: "",
      parseDOM: [
        {
          getAttrs: (dom: Node | string): CodeBlockAttrs => {
            const element = dom as HTMLElement;
            const code = element.querySelector(":scope > code");
            // Never the lang attribute, which is the content's natural language
            const lang = [
              element.getAttribute("data-language"),
              element.getAttribute("data-lang"),
              code?.getAttribute("data-lang"),
              languageFromClass(element),
              languageFromClass(code),
            ].find(
              // An empty value falls back to the next source
              (candidate) => normaliseLanguage(candidate) !== null,
            );
            return codeBlockAttrs(lang, element.getAttribute("data-meta"));
          },
          preserveWhitespace: "full",
          tag: "pre",
        },
        // The node view's language field, which isn't content, if its HTML is
        // parsed (e.g. saved from the editor's own DOM)
        { ignore: true, tag: "label.prosemirror-remark-code-block-language" },
      ],
      toDOM: (node: ProseMirrorNode): DOMOutputSpec => {
        const dom = domAttrs(nodeAttrs(node));
        return [
          "pre",
          { class: "prosemirror-remark-code-block", ...dom.pre },
          ["code", dom.code, 0],
        ];
      },
    };
  }

  public override proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<Text>,
  ): Array<Code> {
    const { lang, meta } = nodeAttrs(node);
    return [
      {
        type: this.unistNodeName(),
        value: convertedChildren.map((child) => child.value).join(""),
        ...(lang === null ? {} : { lang }),
        ...(meta === null ? {} : { meta }),
      },
    ];
  }

  public override proseMirrorNodeView(): NodeViewConstructor | null {
    return (node, view, getPos) => new CodeBlockView(node, view, getPos);
  }

  public override unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor.use(
      buildUnifiedExtension([], [], [{ unsafe: [unsafeInfoStringAmpersand] }]),
    );
  }

  public override unistNodeName(): "code" {
    return "code";
  }

  public override unistNodeToProseMirrorNodes(
    node: Code,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      node.value === "" ? [] : [proseMirrorSchema.text(node.value)],
      codeBlockAttrs(node.lang, node.meta),
    );
  }
}

/**
 * Sets the language of the code block containing the selection. Setting it to
 * `null` (or an empty string) removes the language together with the meta,
 * which Markdown can only carry after a language.
 */
export function setCodeBlockLanguage(lang: string | null): Command {
  return (state, dispatch): boolean => {
    const pos = findCodeBlock(state.selection);
    const node = pos === null ? null : state.doc.nodeAt(pos);
    if (pos === null || node === null) {
      return false;
    }
    if (dispatch) {
      // Only an actual change is dispatched, so a toolbar doesn't create empty
      // undo steps
      const updated = codeBlockAttrs(lang, node.attrs["meta"] as string | null);
      if (
        updated.lang !== node.attrs["lang"] ||
        updated.meta !== node.attrs["meta"]
      ) {
        dispatch(setLanguageAt(state.tr, pos, updated));
      }
    }
    return true;
  };
}

function canBecomeCodeBlock($pos: ResolvedPos, nodeType: NodeType): boolean {
  return (
    // A heading whose text is a fence stays a heading, as in CommonMark
    $pos.parent.type.name === "paragraph" &&
    $pos.node(-1).canReplaceWith($pos.index(-1), $pos.indexAfter(-1), nodeType)
  );
}

function codeBlockAttrs(
  lang: string | null | undefined,
  meta: string | null | undefined,
): CodeBlockAttrs {
  const normalisedLang = normaliseLanguage(lang);
  return {
    lang: normalisedLang,
    meta: normalisedLang === null ? null : normaliseMeta(meta),
  };
}

// The attributes toDOM and the node view render for the language and meta
function domAttrs(attrs: CodeBlockAttrs): {
  code: Record<string, string | null>;
  pre: Record<string, string | null>;
} {
  return {
    code: { class: attrs.lang === null ? null : `language-${attrs.lang}` },
    pre: { "data-language": attrs.lang, "data-meta": attrs.meta },
  };
}

// The attributes for turning the paragraph at $pos into a code block, if it may
// become one, $pos is at its end, and its text (or the given line it's about to
// become) is a fence line
function fenceParagraphAttrs(
  $pos: ResolvedPos,
  nodeType: NodeType,
  line?: string,
): CodeBlockAttrs | null {
  if (
    !canBecomeCodeBlock($pos, nodeType) ||
    $pos.parentOffset !== $pos.parent.content.size
  ) {
    return null;
  }
  return parseFenceLine(line ?? paragraphText($pos));
}

function findCodeBlock(selection: Selection): number | null {
  if (
    selection instanceof NodeSelection &&
    selection.node.type.name === "code_block"
  ) {
    return selection.from;
  }
  const { $from, $to } = selection;
  if (!$from.sameParent($to) || $from.parent.type.name !== "code_block") {
    return null;
  }
  return $from.before();
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

function isRightToLeft(node: Node): boolean {
  const element =
    node.nodeType === node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return (
    element !== null &&
    element.ownerDocument.defaultView?.getComputedStyle(element).direction ===
      "rtl"
  );
}

function languageFromClass(element: Element | null | undefined): string | null {
  for (const className of Array.from(element?.classList ?? [])) {
    const lang = /^(?:language|lang)-(.+)$/u.exec(className)?.[1];
    // Prism marks a block without a language with language-none
    if (lang !== undefined && lang !== "none") {
      return lang;
    }
  }
  return null;
}

// The attributes as they're written out: apps can set them directly, bypassing
// codeBlockAttrs
function nodeAttrs(node: ProseMirrorNode): CodeBlockAttrs {
  return codeBlockAttrs(
    node.attrs["lang"] as string | null,
    node.attrs["meta"] as string | null,
  );
}

// Literal values, cut where Markdown would split the info string
function normaliseLanguage(lang: string | null | undefined): string | null {
  return lang?.split(infoWhitespace).find((word) => word !== "") ?? null;
}

function normaliseMeta(meta: string | null | undefined): string | null {
  // The parser drops leading spaces and tabs, but keeps trailing ones
  const normalised = meta?.replace(/^[ \t]+/u, "") ?? "";
  return normalised === "" ? null : normalised;
}

// The paragraph's text, with a placeholder for images and hard breaks, which
// stop it from being a fence line
function paragraphText($pos: ResolvedPos): string {
  return $pos.parent.textBetween(
    0,
    $pos.parent.content.size,
    undefined,
    "\ufffc",
  );
}

// The attributes of a typeable fence line, as CommonMark reads it, or null if
// the text isn't one
function parseFenceLine(text: string): CodeBlockAttrs | null {
  if (!typeableFenceLine.test(text) || /[\n\r\ufffc]/u.test(text)) {
    return null;
  }
  markdownParser ??= unified().use(remarkParse);
  const { children } = markdownParser.parse(`${text}\n`);
  const [node] = children;
  // Indented code has the line as its value, an unclosed fence has none
  if (children.length !== 1 || node.type !== "code" || node.value !== "") {
    return null;
  }
  return codeBlockAttrs(node.lang, node.meta);
}

// Takes attributes already normalised with codeBlockAttrs
function setLanguageAt(
  tr: Transaction,
  pos: number,
  attrs: CodeBlockAttrs,
): Transaction {
  // Keeping any other attributes, e.g. ones an app's subclass adds
  return tr.setNodeMarkup(pos, undefined, {
    ...tr.doc.nodeAt(pos)?.attrs,
    ...attrs,
  });
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

// The text an input rule's match adds to a paragraph, if the match covers the
// paragraph from its start and the document up to the cursor is what the match
// starts with. An input method replacing a range (autocorrect, Android
// keyboards) breaks that, and is left to the default handling.
function typedIntoParagraph(
  state: EditorState,
  match: RegExpMatchArray,
  start: number,
  end: number,
): string | null {
  const before = state.doc.textBetween(start, end, undefined, "\ufffc");
  if (
    !state.selection.empty ||
    state.doc.resolve(start).parentOffset !== 0 ||
    !match[0].startsWith(before)
  ) {
    return null;
  }
  return match[0].slice(before.length);
}
