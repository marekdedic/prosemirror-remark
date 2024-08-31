import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command, EditorState } from "prosemirror-state";
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

class TaskListItemView implements NodeView {
  public readonly contentDOM: HTMLElement;
  public readonly dom: HTMLElement;

  public constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    const checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("style", "cursor: pointer;");
    if (node.attrs.checked === true) {
      checkbox.setAttribute("checked", "checked");
    }
    checkbox.addEventListener("click", (e) => {
      e.preventDefault();
      view.dispatch(
        view.state.tr.setNodeAttribute(
          getPos()!,
          "checked",
          !(node.attrs.checked as boolean),
        ),
      );
    });

    const checkboxContainer = document.createElement("span");
    checkboxContainer.setAttribute("contenteditable", "false");
    checkboxContainer.setAttribute("style", "position: absolute; left: 5px;");
    checkboxContainer.appendChild(checkbox);

    this.contentDOM = document.createElement("span");
    this.contentDOM.setAttribute("style", "position: relative; left: 30px;");

    this.dom = document.createElement("li");
    this.dom.setAttribute(
      "style",
      "list-style-type: none; margin-left: -30px;",
    );
    this.dom.appendChild(checkboxContainer);
    this.dom.appendChild(this.contentDOM);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Inherited from the NodeView interface
  public stopEvent(): boolean {
    return true;
  }
}

/**
 * @public
 */
export class TaskListItemExtension extends NodeExtension<ListItem> {
  private static isAtStart(
    state: EditorState,
    view: EditorView | undefined,
  ): boolean {
    if (!state.selection.empty) {
      return false;
    }
    if (view !== undefined) {
      return view.endOfTextblock("backward", state);
    }
    return state.selection.$anchor.parentOffset > 0;
  }

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new InputRule(/^\[([x\s]?)\][\s\S]$/u, (state, match, start) => {
        const wrappingNode = state.doc.resolve(start).node(-1);
        if (wrappingNode.type.name !== "regular_list_item") {
          return null;
        }
        return state.tr.replaceRangeWith(
          start - 2,
          start + wrappingNode.nodeSize,
          proseMirrorSchema.nodes[this.proseMirrorNodeName()].createAndFill(
            { checked: match[1] === "x" },
            wrappingNode.content.cut(3 + match[1].length),
          )!,
        );
      }),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      Backspace: (state, dispatch, view): boolean => {
        if (!TaskListItemExtension.isAtStart(state, view)) {
          return false;
        }
        const taskListItemNode = state.selection.$anchor.node(-1);
        if (taskListItemNode.type.name !== "task_list_item") {
          return false;
        }
        if (dispatch === undefined) {
          return true;
        }
        dispatch(
          state.tr.replaceRangeWith(
            state.selection.$from.before() - 2,
            state.selection.$from.before() + taskListItemNode.nodeSize,
            proseMirrorSchema.nodes.regular_list_item.createAndFill(
              {},
              taskListItemNode.content,
            )!,
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
      content: "paragraph block*",
      defining: true,
      group: "list_item",
      attrs: { checked: { default: false } },
      parseDOM: [
        {
          tag: "li",
          getAttrs(dom: Node | string): false | { checked: boolean } {
            const checkbox = (dom as HTMLElement).firstChild;
            if (!(checkbox instanceof HTMLInputElement)) {
              return false;
            }
            return { checked: checkbox.checked };
          },
        },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return [
          "li",
          { style: "list-style-type: none;, margin-left: -30px;" },
          [
            "span",
            {
              contenteditable: "false",
              style: "position: absolute; left: 5px;",
            },
            [
              "input",
              {
                type: "checkbox",
                checked: (node.attrs.checked as boolean)
                  ? "checked"
                  : undefined,
                disabled: "disabled",
              },
            ],
          ],
          ["span", { style: "position: relative; left: 30px" }, 0],
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
        type: this.unistNodeName(),
        checked: node.attrs.checked as boolean,
        children: convertedChildren,
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
