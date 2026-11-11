import type { List, ListContent } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { Node as UnistNode } from "unist";

import { type InputRule, wrappingInputRule } from "prosemirror-inputrules";
import { wrapInList } from "prosemirror-schema-list";
import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";

import {
  isUnistListLoose,
  itemsWithListSpread,
  parseListSpread,
} from "../utils/listSpread";
import { skipInCodeMark } from "../utils/skipInCodeMark";
import { typedSpace } from "../utils/typedSpace";
import { ListItemExtension } from "./ListItemExtension";

export class OrderedListExtension extends NodeExtension<List> {
  public override dependencies(): Array<Extension> {
    return [new ListItemExtension()];
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      skipInCodeMark(
        wrappingInputRule(
          new RegExp(`^\\s{0,3}(?<start>\\d+)\\.${typedSpace}$`, "u"),
          proseMirrorSchema.nodes[this.proseMirrorNodeName()],
          (match) => ({ start: Number(match.groups?.["start"]) }),
          (match, node) =>
            node.childCount + (node.attrs["start"] as number) ===
            Number(match.groups?.["start"]),
        ),
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      "Shift-Mod-9": wrapInList(
        proseMirrorSchema.nodes[this.proseMirrorNodeName()],
      ),
    };
  }

  public override proseMirrorNodeName(): string {
    return "ordered_list";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      attrs: { spread: { default: false }, start: { default: 1 } },
      content: "list_item+",
      group: "block",
      parseDOM: [
        {
          getAttrs: (
            dom: Node | string,
          ): { spread: boolean; start: number } => {
            const start = (dom as HTMLElement).getAttribute("start");
            return {
              spread: parseListSpread(dom as HTMLElement),
              start: start === null ? 1 : parseInt(start, 10),
            };
          },
          tag: "ol",
        },
      ],
      toDOM: (node: ProseMirrorNode): DOMOutputSpec => [
        "ol",
        {
          "data-spread": node.attrs["spread"] as boolean,
          start: node.attrs["start"] as number,
        },
        0,
      ],
    };
  }

  public override proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<ListContent>,
  ): Array<List> {
    const spread = node.attrs["spread"] as boolean;
    return [
      {
        children: itemsWithListSpread(convertedChildren, spread),
        ordered: true,
        spread,
        start: node.attrs["start"] as number,
        type: this.unistNodeName(),
      },
    ];
  }

  public override unistNodeName(): "list" {
    return "list";
  }

  public override unistNodeToProseMirrorNodes(
    node: List,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
      {
        spread: isUnistListLoose(node),
        start: node.start ?? 1,
      },
    );
  }

  public override unistToProseMirrorTest(node: UnistNode): boolean {
    return (
      node.type === this.unistNodeName() && (node as List).ordered === true
    );
  }
}
