import type { Code, Text } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class CodeBlockExtension extends NodeExtension<Code> {
  public mdastNodeName(): "code" {
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

  public mdastNodeToProseMirrorNodes(
    node: Code,
    schema: Schema<string, string>
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes[
      this.proseMirrorNodeName()
    ].createAndFill({}, [schema.text(node.value)]);
    if (proseMirrorNode === null) {
      return [];
    }
    return [proseMirrorNode];
  }

  public proseMirrorNodeToMdastNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<Text>
  ): Array<Code> {
    return [
      {
        type: this.mdastNodeName(),
        value: convertedChildren.map((child) => child.value).join(""),
      },
    ];
  }
}
