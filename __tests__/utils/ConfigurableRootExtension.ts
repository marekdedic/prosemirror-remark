import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

interface ConfigurableUnistRoot<ChildNode extends UnistNode> extends UnistNode {
  type: "root";
  children: Array<ChildNode>;
}

export class ConfigurableRootExtension<
  ChildNode extends UnistNode
> extends NodeExtension<ConfigurableUnistRoot<ChildNode>> {
  private readonly nodeExtension: NodeExtension<UnistNode>;

  public constructor(nodeExtension: NodeExtension<UnistNode>) {
    super();

    this.nodeExtension = nodeExtension;
  }

  public unistNodeName(): "root" {
    return "root";
  }

  public proseMirrorNodeName(): string {
    return "doc";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: this.nodeExtension.proseMirrorNodeName() ?? "text" + "+",
    };
  }

  public unistNodeToProseMirrorNodes(
    _: ConfigurableUnistRoot<ChildNode>,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren
    );
  }

  public proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<ConfigurableUnistRoot<ChildNode>> {
    return [
      {
        type: "root",
        children: convertedChildren as Array<ChildNode>,
      },
    ];
  }
}
