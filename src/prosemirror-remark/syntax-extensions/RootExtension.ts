import type { Content, Root } from "mdast";
import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class RootExtension extends NodeExtension<Root> {
  public unistNodeName(): "root" {
    return "root";
  }

  public proseMirrorNodeName(): string {
    return "doc";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return { content: "block+" };
  }

  public unistNodeToProseMirrorNodes(
    _node: Root,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<Content>
  ): Array<Root> {
    return [{ type: this.unistNodeName(), children: convertedChildren }];
  }
}
