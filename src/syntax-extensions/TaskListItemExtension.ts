import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";
import type {
  EditorView,
  NodeView,
  NodeViewConstructor,
} from "prosemirror-view";
import type { Node as UnistNode } from "unist";

class TaskListItemView implements NodeView {
  public readonly dom: HTMLElement;
  public readonly contentDOM: HTMLElement;

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
    checkboxContainer.appendChild(checkbox);

    this.contentDOM = document.createElement("span");
    this.contentDOM.setAttribute("style", "display: inline-block;");

    this.dom = document.createElement("li");
    this.dom.setAttribute("style", "list-style-type: none;");
    this.dom.appendChild(checkboxContainer);
    this.dom.appendChild(this.contentDOM);
  }

  public stopEvent(): boolean {
    return true;
  }
}

/**
 * @public
 *
 * TODO: Add GFM to remark
 * TODO: Add a keymap
 */
export class TaskListItemExtension extends NodeExtension<ListItem> {
  public unistNodeName(): "listItem" {
    return "listItem";
  }

  public proseMirrorNodeName(): string {
    return "task_list_item";
  }

  public proseMirrorNodeSpec(): NodeSpec {
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
          { style: "list-style-type: none;" },
          [
            "span",
            { contenteditable: "false" },
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
          ["span", { style: "display: inline-block;" }, 0],
        ];
      },
    };
  }

  public proseMirrorNodeView(): NodeViewConstructor | null {
    return (node, view, getPos) => new TaskListItemView(node, view, getPos);
  }

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new InputRule(/^\[([x\s]?)\][\s\S]$/, (state, match, start) => {
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

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() &&
      "checked" in node &&
      typeof node.checked === "boolean"
    );
  }

  public unistNodeToProseMirrorNodes(
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

  public proseMirrorNodeToUnistNodes(
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
}
