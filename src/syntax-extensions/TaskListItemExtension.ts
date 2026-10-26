import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type {
  EditorView,
  NodeView,
  NodeViewConstructor,
} from "prosemirror-view";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import {
  gfmTaskListItemFromMarkdown,
  gfmTaskListItemToMarkdown,
} from "mdast-util-gfm-task-list-item";
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item";
import { InputRule } from "prosemirror-inputrules";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

import { buildUnifiedExtension } from "../utils/buildUnifiedExtension";
import { isAtStart } from "../utils/isAtStart";
import { listItemKeymap } from "../utils/listItemKeymap";
import { uniqueId } from "../utils/uniqueId";

class TaskListItemView implements NodeView {
  public readonly contentDOM: HTMLElement;
  public readonly dom: HTMLElement;
  private readonly checkboxContainer: HTMLElement;
  private readonly editableObserver: MutationObserver;

  public constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    // The editor may be in another window, e.g. an iframe
    const doc = view.dom.ownerDocument;
    // The checkbox takes its accessible name from the item's content
    const id = contentId();
    const checkbox = doc.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("aria-labelledby", id);
    if (node.attrs["checked"] === true) {
      checkbox.setAttribute("checked", "checked");
    }
    checkbox.disabled = !view.editable;
    checkbox.addEventListener("click", (e) => {
      const pos = getPos();
      if (pos === undefined) {
        return;
      }
      e.preventDefault();
      if (!view.editable) {
        return;
      }
      view.dispatch(
        view.state.tr.setNodeAttribute(
          pos,
          "checked",
          !(node.attrs["checked"] as boolean),
        ),
      );
    });
    checkbox.addEventListener("keydown", (e) => {
      // Enter in a lone input would submit an enclosing form
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });

    this.checkboxContainer = doc.createElement("span");
    this.checkboxContainer.setAttribute("contenteditable", "false");
    this.checkboxContainer.setAttribute(
      "class",
      "prosemirror-remark-task-list-item-checkbox",
    );
    this.checkboxContainer.appendChild(checkbox);

    this.contentDOM = doc.createElement("div");
    this.contentDOM.setAttribute(
      "class",
      "prosemirror-remark-task-list-item-content",
    );
    this.contentDOM.setAttribute("id", id);

    this.dom = doc.createElement("li");
    this.dom.setAttribute("class", "prosemirror-remark-task-list-item");
    this.dom.setAttribute(
      "data-checked",
      String(node.attrs["checked"] as boolean),
    );
    this.dom.setAttribute(
      "data-spread",
      String(node.attrs["spread"] as boolean),
    );
    this.dom.appendChild(this.checkboxContainer);
    this.dom.appendChild(this.contentDOM);

    // The node view isn't updated when only the editor's editable prop
    // changes, and a disabled checkbox gets no events of its own to catch up
    // on. ProseMirror mirrors the prop in the editor's contenteditable
    // attribute, so the checkbox follows that
    const Observer = doc.defaultView?.MutationObserver ?? MutationObserver;
    this.editableObserver = new Observer(() => {
      checkbox.disabled = !view.editable;
    });
    this.editableObserver.observe(view.dom, {
      attributeFilter: ["contenteditable"],
    });
  }

  public destroy(): void {
    this.editableObserver.disconnect();
  }

  // No instanceof checks: in an iframe, events and nodes come from another
  // window than the global classes
  public stopEvent(event: Event): boolean {
    return this.checkboxContainer.contains(event.target as Node | null);
  }
}

export class TaskListItemExtension extends NodeExtension<ListItem> {
  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new InputRule(
        /^\[(?<checked>[\sx]?)\][\s\S]$/iu,
        (state, match, start, end) => {
          const $start = state.doc.resolve(start);
          if (
            $start.node(-1).type.name !== "regular_list_item" ||
            $start.parent.type.name !== "paragraph" ||
            $start.index(-1) !== 0
          ) {
            return null;
          }
          return state.tr
            .delete(start, end)
            .setNodeMarkup(
              $start.before(-1),
              proseMirrorSchema.nodes[this.proseMirrorNodeName()],
              {
                checked: match.groups?.["checked"].toLowerCase() === "x",
                spread: $start.node(-1).attrs["spread"] as boolean,
              },
            );
        },
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      ...listItemKeymap(proseMirrorSchema.nodes[this.proseMirrorNodeName()], {
        checked: false,
      }),
      Backspace: (state, dispatch, view): boolean => {
        if (!isAtStart(state, view)) {
          return false;
        }
        const { $anchor } = state.selection;
        if (
          $anchor.node(-1).type.name !== "task_list_item" ||
          $anchor.index(-1) !== 0
        ) {
          return false;
        }
        if (dispatch === undefined) {
          return true;
        }
        dispatch(
          state.tr.setNodeMarkup(
            $anchor.before(-1),
            proseMirrorSchema.nodes["regular_list_item"],
            { spread: $anchor.node(-1).attrs["spread"] as boolean },
          ),
        );
        return true;
      },
    };
  }

  public override proseMirrorNodeName(): string {
    return "task_list_item";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      attrs: { checked: { default: false }, spread: { default: false } },
      content: "paragraph block*",
      defining: true,
      group: "list_item",
      parseDOM: [
        {
          getAttrs: (
            dom: Node | string,
          ): false | { checked: boolean; spread: boolean } => {
            // No instanceof check: the DOM may come from another window, e.g.
            // an iframe
            const checkbox = (
              dom as HTMLElement
            ).querySelector<HTMLInputElement>(
              ":scope > input[type=checkbox], :scope > span > input[type=checkbox]",
            );
            if (checkbox === null) {
              return false;
            }
            return {
              checked: checkbox.checked,
              spread:
                (dom as HTMLElement).getAttribute("data-spread") === "true",
            };
          },
          priority: 60,
          tag: "li",
        },
      ],
      toDOM: (node: ProseMirrorNode): DOMOutputSpec => {
        // The checkbox takes its accessible name from the item's content
        const id = contentId();
        return [
          "li",
          {
            class: "prosemirror-remark-task-list-item",
            "data-checked": node.attrs["checked"] as boolean,
            "data-spread": node.attrs["spread"] as boolean,
          },
          [
            "span",
            {
              class: "prosemirror-remark-task-list-item-checkbox",
              contenteditable: "false",
            },
            [
              "input",
              {
                "aria-labelledby": id,
                checked: (node.attrs["checked"] as boolean)
                  ? "checked"
                  : undefined,
                disabled: "disabled",
                type: "checkbox",
              },
            ],
          ],
          [
            "div",
            { class: "prosemirror-remark-task-list-item-content", id },
            0,
          ],
        ];
      },
    };
  }

  public override proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>,
  ): Array<ListItem> {
    return [
      {
        checked: node.attrs["checked"] as boolean,
        children: convertedChildren,
        spread: node.attrs["spread"] as boolean,
        type: this.unistNodeName(),
      },
    ];
  }

  public override proseMirrorNodeView(): NodeViewConstructor | null {
    return (node, view, getPos) => new TaskListItemView(node, view, getPos);
  }

  public override unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor.use(
      buildUnifiedExtension(
        [gfmTaskListItem()],
        [gfmTaskListItemFromMarkdown()],
        [gfmTaskListItemToMarkdown()],
      ),
    );
  }

  public override unistNodeName(): "listItem" {
    return "listItem";
  }

  public override unistNodeToProseMirrorNodes(
    node: ListItem,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
      { checked: node.checked, spread: node.spread === true },
    );
  }

  public override unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() &&
      "checked" in node &&
      typeof node.checked === "boolean"
    );
  }
}

function contentId(): string {
  return uniqueId("prosemirror-remark-task-list-item-content");
}
