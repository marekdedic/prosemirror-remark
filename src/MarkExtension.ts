import type { Mark, MarkSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class MarkExtension<
  UNode extends UnistNode
> extends SyntaxExtension<UNode> {
  public abstract proseMirrorMarkName(): string;

  public abstract proseMirrorMarkSpec(): MarkSpec;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Add a for compatible source nodes
  public abstract modifyMdastNode(
    convertedNode: UnistNode,
    originalMark: Mark
  ): UNode;
}
