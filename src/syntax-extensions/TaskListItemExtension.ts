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

const itemStyle = "list-style-type: none; margin-left: -30px;";
const checkboxContainerStyle = "position: absolute; left: 5px;";
const contentStyle = "position: relative; left: 30px;";

class TaskListItemView implements NodeView {
  public readonly contentDOM: HTMLElement;
  public readonly dom: HTMLElement;
  private readonly checkboxContainer: HTMLElement;

  public constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    const checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("style", "cursor: pointer;");
    if (node.attrs["checked"] === true) {
      checkbox.setAttribute("checked", "checked");
    }
    checkbox.addEventListener("click", (e) => {
      const pos = getPos();
      if (pos === undefined) {
        return;
      }
      e.preventDefault();
      view.dispatch(
        view.state.tr.setNodeAttribute(
          pos,
          "checked",
          !(node.attrs["checked"] as boolean),
        ),
      );
    });

    this.checkboxContainer = document.createElement("span");
    this.checkboxContainer.setAttribute("contenteditable", "false");
    this.checkboxContainer.setAttribute("style", checkboxContainerStyle);
    this.checkboxContainer.appendChild(checkbox);

    this.contentDOM = document.createElement("span");
    this.contentDOM.setAttribute("style", contentStyle);

    this.dom = document.createElement("li");
    this.dom.setAttribute("style", itemStyle);
    this.dom.appendChild(this.checkboxContainer);
    this.dom.appendChild(this.contentDOM);
  }

  public stopEvent(event: Event): boolean {
    return (
      event.target instanceof Node &&
      this.checkboxContainer.contains(event.target)
    );
  }
}

export class TaskListItemExtension extends NodeExtension<ListItem> {
  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new InputRule(/^\[([x\s]?)\][\s\S]$/u, (state, match, start, end) => {
        const $start = state.doc.resolve(start);
        if (
          $start.node(-1).type.name !== "regular_list_item" ||
          $start.index(-1) !== 0
        ) {
          return null;
        }
        return state.tr
          .delete(start, end)
          .setNodeMarkup(
            $start.before(-1),
            proseMirrorSchema.nodes[this.proseMirrorNodeName()],
            { checked: match[1] === "x" },
          );
      }),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      Backspace: (state, dispatch, view): boolean => {
        if (!isAtStart(state, view)) {
          return false;
        }
        const { $anchor } = state.selection;
        if ($anchor.node(-1).type.name !== "task_list_item") {
          return false;
        }
        if (dispatch === undefined) {
          return true;
        }
        dispatch(
          state.tr.setNodeMarkup(
            $anchor.before(-1),
            proseMirrorSchema.nodes["regular_list_item"],
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
      attrs: { checked: { default: false } },
      content: "paragraph block*",
      defining: true,
      group: "list_item",
      parseDOM: [
        {
          getAttrs: (dom: Node | string): false | { checked: boolean } => {
            const checkbox = (dom as HTMLElement).querySelector(
              ":scope > input[type=checkbox], :scope > span > input[type=checkbox]",
            );
            if (!(checkbox instanceof HTMLInputElement)) {
              return false;
            }
            return { checked: checkbox.checked };
          },
          priority: 60,
          tag: "li",
        },
      ],
      toDOM: (node: ProseMirrorNode): DOMOutputSpec => [
        "li",
        { style: itemStyle },
        [
          "span",
          {
            contenteditable: "false",
            style: checkboxContainerStyle,
          },
          [
            "input",
            {
              checked: (node.attrs["checked"] as boolean)
                ? "checked"
                : undefined,
              disabled: "disabled",
              type: "checkbox",
            },
          ],
        ],
        ["span", { style: contentStyle }, 0],
      ],
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
      { checked: node.checked },
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
