import type { Code, Text } from "mdast";
import type { Unsafe } from "mdast-util-to-markdown";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { NodeViewConstructor } from "prosemirror-view";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { chainCommands, setBlockType } from "prosemirror-commands";
import {
  type Command,
  type EditorState,
  NodeSelection,
  Selection,
  type Transaction,
} from "prosemirror-state";
import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";

import { buildUnifiedExtension } from "../utils/buildUnifiedExtension";
import {
  type CodeBlockAttrs,
  codeBlockAttrs,
  domAttrs,
  nodeAttrs,
  normaliseLanguage,
} from "../utils/codeBlockAttrs";
import { codeBlockInputRules, fenceOnEnter } from "../utils/codeBlockInput";
import { isRightToLeft } from "../utils/isRightToLeft";
import { CodeBlockView } from "./CodeBlockView";
import { TextExtension } from "./TextExtension";

// The character references CommonMark decodes in an info string
const unsafeInfoStringAmpersand: Unsafe = {
  after: "#?[\\dA-Za-z]+;",
  character: "&",
  inConstruct: [
    "codeFencedLangGraveAccent",
    "codeFencedLangTilde",
    "codeFencedMetaGraveAccent",
    "codeFencedMetaTilde",
  ],
};

export class CodeBlockExtension extends NodeExtension<Code> {
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
        !$from.sameParent($to) ||
        $from.parent.type.name !== "code_block" ||
        $from.parentOffset !== $from.parent.content.size ||
        !$from.parent.textBetween(0, $from.parentOffset).endsWith("\n\n")
      ) {
        return false;
      }
      if (dispatch) {
        const tr = state.tr;
        dispatch(
          tr
            .deleteRange($from.pos - 2, $from.pos)
            .insert(
              $from.pos - 1,
              tr.doc.type.schema.nodes["paragraph"].create(),
            )
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
    return codeBlockInputRules(
      proseMirrorSchema.nodes[this.proseMirrorNodeName()],
    );
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
        fenceOnEnter(nodeType),
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
            ].find((candidate) => normaliseLanguage(candidate) !== null);
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
 * `null` (or an empty string) removes the language. The meta is kept, but
 * Markdown can only carry it after a language.
 */
export function setCodeBlockLanguage(lang: string | null): Command {
  return (state, dispatch): boolean => {
    const block = findCodeBlock(state.selection);
    if (block === null) {
      return false;
    }
    const { node, pos } = block;
    if (dispatch) {
      // A toolbar mustn't create empty undo steps
      const updated = normaliseLanguage(lang);
      if (updated !== node.attrs["lang"]) {
        dispatch(state.tr.setNodeAttribute(pos, "lang", updated));
      }
    }
    return true;
  };
}

function findCodeBlock(
  selection: Selection,
): { node: ProseMirrorNode; pos: number } | null {
  if (
    selection instanceof NodeSelection &&
    selection.node.type.name === "code_block"
  ) {
    return { node: selection.node, pos: selection.from };
  }
  const { $from, $to } = selection;
  if (!$from.sameParent($to) || $from.parent.type.name !== "code_block") {
    return null;
  }
  return { node: $from.parent, pos: $from.before() };
}

function languageFromClass(element: Element | null | undefined): string | null {
  for (const className of Array.from(element?.classList ?? [])) {
    const lang = /^(?:lang|language)-(.+)$/u.exec(className)?.[1];
    // Prism marks a block without a language with language-none
    if (lang !== undefined && lang !== "none") {
      return lang;
    }
  }
  return null;
}
