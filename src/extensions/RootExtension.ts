import type { Content, Root } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { ProseMirrorRemarkExtension } from "../ProseMirrorRemarkExtension";
import type { SchemaExtension } from "../SchemaExtension";

export class RootExtension extends ProseMirrorRemarkExtension {
  public matchingMdastNodes(): Array<string> {
    return ["root"];
  }

  public matchingProseMirrorNodes(): Array<string> {
    return ["doc"];
  }

  public schema(): SchemaExtension {
    return { nodes: { doc: { content: "block+" } } };
  }

  public mdastNodeToProseMirrorNode(
    _: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes["doc"].createAndFill(
      {},
      convertedChildren
    );
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public proseMirrorNodeToMdastNode(
    _: ProseMirrorNode,
    convertedChildren: Array<Content>
  ): Array<Root> {
    return [{ type: "root", children: convertedChildren }];
  }
}
