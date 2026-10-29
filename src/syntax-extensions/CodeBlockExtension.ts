import type { Code, Text } from "mdast";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { NodeViewConstructor } from "prosemirror-view";

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

import {
  type CodeBlockAttrs,
  codeBlockAttrs,
  domAttrs,
  nodeAttrs,
  normaliseLanguage,
  normaliseMeta,
} from "../utils/codeBlockAttrs";
import { codeBlockInputRules, fenceOnEnter } from "../utils/codeBlockInput";
import {
  findControlInput,
  leavesTextblockStart,
} from "../utils/nodeViewControl";
import { focusCodeBlockField } from "./CodeBlockField";
import { CodeBlockView } from "./CodeBlockView";
import { TextExtension } from "./TextExtension";

export class CodeBlockExtension extends NodeExtension<Code> {
  private static focusField(direction: "left" | "right" | "up"): Command {
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
          : // At the start, the key that leaves the code on its side. In an
            // empty block, the code's direction decides.
            leavesTextblockStart(
              view,
              $from,
              direction,
              () => view.domAtPos($from.pos).node,
            );
      if (!atEdge) {
        return false;
      }
      // Up goes to the start of the tab. Leaving the code at its start goes to
      // the field next to it, or past it if the app hides it.
      const fields =
        direction === "up"
          ? ["prosemirror-remark-code-block-language"]
          : [
              "prosemirror-remark-code-block-meta",
              "prosemirror-remark-code-block-language",
            ];
      const inputs = fields
        .map((field) =>
          findControlInput(
            view,
            $from.before(),
            "prosemirror-remark-code-block-info",
            field,
          ),
        )
        .filter((input) => input !== null);
      if (inputs.length === 0) {
        return false;
      }
      const caret = (
        { left: "ArrowLeft", right: "ArrowRight", up: "end" } as const
      )[direction];
      return (
        !dispatch ||
        inputs.some((input) => focusCodeBlockField(view, input, caret))
      );
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
      ArrowLeft: CodeBlockExtension.focusField("left"),
      ArrowRight: CodeBlockExtension.focusField("right"),
      ArrowUp: CodeBlockExtension.focusField("up"),
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
        // The node view's fields, which aren't content, if its HTML is parsed
        // (e.g. saved from the editor's own DOM)
        { ignore: true, tag: "div.prosemirror-remark-code-block-info" },
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
  return setCodeBlockAttribute("lang", normaliseLanguage(lang));
}

/**
 * Sets the meta (the rest of the info string after the language) of the code
 * block containing the selection. Setting it to `null` (or an empty string)
 * removes the meta. The language is kept. A code block without a language
 * keeps its meta, but Markdown can only carry it after a language.
 */
export function setCodeBlockMeta(meta: string | null): Command {
  return setCodeBlockAttribute("meta", normaliseMeta(meta));
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
    const lang = /^(?:lang|language)-(?<lang>.+)$/u.exec(className)?.groups?.[
      "lang"
    ];
    // Prism marks a block without a language with language-none
    if (lang !== undefined && lang !== "none") {
      return lang;
    }
  }
  return null;
}

function setCodeBlockAttribute(
  attribute: keyof CodeBlockAttrs,
  value: string | null,
): Command {
  return (state, dispatch): boolean => {
    const block = findCodeBlock(state.selection);
    if (block === null) {
      return false;
    }
    const { node, pos } = block;
    // A toolbar mustn't create empty undo steps. Apps can set the attributes
    // directly, so they're compared as they're written out.
    if (dispatch && value !== nodeAttrs(node)[attribute]) {
      dispatch(state.tr.setNodeAttribute(pos, attribute, value));
    }
    return true;
  };
}
