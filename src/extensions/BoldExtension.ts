import type { Strong } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { ProseMirrorRemarkExtension } from "../ProseMirrorRemarkExtension";
import type { SchemaExtension } from "../SchemaExtension";

export class BoldExtension extends ProseMirrorRemarkExtension {
  public matchingMdastNodes(): Array<string> {
    return ["strong"];
  }

  // TODO
  public matchingProseMirrorNodes(): Array<string> {
    return [];
  }

  public schema(): SchemaExtension {
    return {
      marks: {
        strong: {
          parseDOM: [{ tag: "b" }, { tag: "strong" }],
          toDOM(): DOMOutputSpec {
            return ["strong"];
          },
        },
      },
    };
  }

  public mdastNodeToProseMirrorNode(
    _: Strong,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(child.marks.concat([schema.marks["strong"].create()]))
    );
  }

  // TODO
  public proseMirrorNodeToMdastNode(
    _node: ProseMirrorNode,
    _convertedChildren: Array<UnistNode>
  ): Array<UnistNode> {
    return [];
  }
}
