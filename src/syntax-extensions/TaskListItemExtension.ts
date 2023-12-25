import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import {
  gfmTaskListItemFromMarkdown,
  gfmTaskListItemToMarkdown,
} from "mdast-util-gfm-task-list-item";
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { buildUnifiedExtension } from "../utils/buildUnifiedExtension";

/**
 * @public
 *
 * TODO: Add a keymap
 */
export class TaskListItemExtension extends NodeExtension<ListItem> {
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
          [
            "input",
            {
              type: "checkbox",
              checked: (node.attrs.checked as boolean) ? "checked" : undefined,
            },
          ],
          ["span", { style: "display: inline-block;" }, 0],
        ];
      },
    };
  }

  public override unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() &&
      "checked" in node &&
      typeof node.checked === "boolean"
    );
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
}
