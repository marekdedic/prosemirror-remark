import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

interface ConfigurableUnistRoot<ChildUnistNode extends UnistNode>
  extends UnistNode {
  type: "root";
  children: Array<ChildUnistNode>;
}

export class ConfigurableRootExtension<
  ChildUnistNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown>
> extends NodeExtension<ConfigurableUnistRoot<ChildUnistNode>> {
  private readonly nodeExtension: NodeExtension<
    ChildUnistNode,
    UnistToProseMirrorContext
  >;

  public constructor(
    nodeExtension: NodeExtension<ChildUnistNode, UnistToProseMirrorContext>
  ) {
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
    _: ConfigurableUnistRoot<ChildUnistNode>,
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
  ): Array<ConfigurableUnistRoot<ChildUnistNode>> {
    return [
      {
        type: "root",
        children: convertedChildren as Array<ChildUnistNode>,
      },
    ];
  }
}
