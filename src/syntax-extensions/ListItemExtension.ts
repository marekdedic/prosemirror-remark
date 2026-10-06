import type { BlockContent, DefinitionContent, ListItem } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { Node as UnistNode } from "unist";

import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

import { listItemKeymap } from "../utils/listItemKeymap";

export class ListItemExtension extends NodeExtension<ListItem> {
  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return listItemKeymap(proseMirrorSchema.nodes[this.proseMirrorNodeName()]);
  }

  public override proseMirrorNodeName(): string {
    return "regular_list_item";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      attrs: { spread: { default: false } },
      content: "paragraph block*",
      defining: true,
      group: "list_item",
      parseDOM: [
        {
          getAttrs: (dom: Node | string): { spread: boolean } => ({
            spread: (dom as HTMLElement).getAttribute("data-spread") === "true",
          }),
          tag: "li",
        },
      ],
      toDOM: (node: ProseMirrorNode): DOMOutputSpec => [
        "li",
        { "data-spread": node.attrs["spread"] as boolean },
        0,
      ],
    };
  }

  public override proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>,
  ): Array<ListItem> {
    return [
      {
        children: convertedChildren,
        spread: node.attrs["spread"] as boolean,
        type: this.unistNodeName(),
      },
    ];
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
      { spread: node.spread === true },
    );
  }

  public override unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() &&
      (!("checked" in node) || typeof node.checked !== "boolean")
    );
  }
}
