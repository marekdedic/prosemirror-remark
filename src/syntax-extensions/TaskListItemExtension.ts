import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

/**
 * @public
 *
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
          [
            "input",
            {
              type: "checkbox",
              checked: (node.attrs.checked as boolean) ? "checked" : undefined,
            },
          ],
          ["span", 0],
        ];
      },
    };
  }

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return node.type === this.unistNodeName() && "checked" in node;
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
