import type { List, ListContent } from "mdast";
import { type InputRule, wrappingInputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import { wrapInList } from "prosemirror-schema-list";
import type { Command } from "prosemirror-state";
import { type Extension, NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { ListItemExtension } from "./ListItemExtension";

export class OrderedListExtension extends NodeExtension<List> {
  public dependencies(): Array<Extension> {
    return [new ListItemExtension()];
  }

  public unistNodeName(): "list" {
    return "list";
  }

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() && (node as List).ordered === true
    );
  }

  public proseMirrorNodeName(): string {
    return "ordered_list";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "list_item+",
      group: "block",
      attrs: { spread: { default: false }, start: { default: 1 } },
      parseDOM: [
        {
          getAttrs(dom: Node | string): { spread: boolean; start: number } {
            const start = (dom as HTMLElement).getAttribute("start");
            return {
              spread:
                (dom as HTMLElement).getAttribute("data-spread") === "true",
              start: start !== null ? parseInt(start) : 1,
            };
          },
          tag: "ol",
        },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return [
          "ol",
          {
            "data-spread": node.attrs.spread as boolean,
            start: node.attrs.start as number,
          },
          0,
        ];
      },
    };
  }

  public proseMirrorInputRules(): Array<InputRule> {
    return [
      wrappingInputRule(
        /^\s{0,3}(\d+)\.\s$/,
        this.proseMirrorSchema().nodes[this.proseMirrorNodeName()],
        (match) => ({ start: +match[1] }),
        (match, node) =>
          node.childCount + (node.attrs.start as number) == +match[1]
      ),
    ];
  }

  public proseMirrorKeymap(): Record<string, Command> {
    return {
      "Shift-Mod-9": wrapInList(
        this.proseMirrorSchema().nodes[this.proseMirrorNodeName()]
      ),
    };
  }

  public unistNodeToProseMirrorNodes(
    node: List,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren, {
      spread: node.spread,
      start: node.start ?? 1,
    });
  }

  public proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<ListContent>
  ): Array<List> {
    const spread = node.attrs.spread as boolean;
    return [
      {
        type: this.unistNodeName(),
        ordered: true,
        spread,
        start: node.attrs.start as number,
        children: convertedChildren.map((child) => {
          child.spread = spread;
          return child;
        }),
      },
    ];
  }
}
