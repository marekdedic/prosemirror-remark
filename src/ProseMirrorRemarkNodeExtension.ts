import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";

export abstract class ProseMirrorRemarkNodeExtension extends ProseMirrorRemarkExtension {
  // TODO: Maybe just one string?
  public abstract mdastNodeName(): string;

  // TODO: Maybe just one string?
  public abstract proseMirrorNodeName(): string;

  public abstract proseMirrorNodeSpec(): NodeSpec;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Make this generic
  public abstract mdastNodeToProseMirrorNode(
    node: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode>;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Make this generic
  public abstract proseMirrorNodeToMdastNode(
    node: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UnistNode>;
}
