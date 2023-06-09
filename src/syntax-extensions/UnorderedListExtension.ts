import type { List, ListContent } from "mdast";
import { type InputRule, wrappingInputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { wrapInList } from "prosemirror-schema-list";
import type { Command } from "prosemirror-state";
import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { ListItemExtension } from "./ListItemExtension";

/**
 * @public
 */
export class UnorderedListExtension extends NodeExtension<List> {
  public dependencies(): Array<Extension> {
    return [new ListItemExtension()];
  }

  public unistNodeName(): "list" {
    return "list";
  }

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() && (node as List).ordered !== true
    );
  }

  public proseMirrorNodeName(): string {
    return "bullet_list";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "list_item+",
      group: "block",
      attrs: { spread: { default: false } },
      parseDOM: [
        {
          getAttrs(dom: Node | string): { spread: boolean } {
            return {
              spread:
                (dom as HTMLElement).getAttribute("data-spread") === "true",
            };
          },
          tag: "ul",
        },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return ["ul", { "data-spread": node.attrs.spread as boolean }, 0];
      },
    };
  }

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>
  ): Array<InputRule> {
    return [
      wrappingInputRule(
        /^\s{0,3}([-+*])\s$/,
        proseMirrorSchema.nodes[this.proseMirrorNodeName()]
      ),
    ];
  }

  public proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>
  ): Record<string, Command> {
    return {
      "Shift-Mod-8": wrapInList(
        proseMirrorSchema.nodes[this.proseMirrorNodeName()]
      ),
    };
  }

  public unistNodeToProseMirrorNodes(
    node: List,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
      {
        spread: node.spread,
      }
    );
  }

  public proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<ListContent>
  ): Array<List> {
    const spread = node.attrs.spread as boolean;
    return [
      {
        type: this.unistNodeName(),
        ordered: false,
        spread,
        children: convertedChildren.map((child) => {
          child.spread = spread;
          return child;
        }),
      },
    ];
  }
}
