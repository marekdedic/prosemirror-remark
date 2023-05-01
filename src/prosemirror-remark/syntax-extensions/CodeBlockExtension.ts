import type { Code, Text } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class CodeBlockExtension extends NodeExtension<Code> {
  public unistNodeName(): "code" {
    return "code";
  }

  public proseMirrorNodeName(): string {
    return "code_block";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "text*",
      group: "block",
      code: true,
      defining: true,
      marks: "",
      parseDOM: [{ tag: "pre" }],
      toDOM(): DOMOutputSpec {
        return ["pre", ["code", 0]];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    node: Code,
    schema: Schema<string, string>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, [schema.text(node.value)]);
  }

  public proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<Text>
  ): Array<Code> {
    return [
      {
        type: this.unistNodeName(),
        value: convertedChildren.map((child) => child.value).join(""),
      },
    ];
  }
}
