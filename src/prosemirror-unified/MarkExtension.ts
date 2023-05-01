import type { Mark, MarkSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class MarkExtension<
  UNode extends UnistNode
> extends SyntaxExtension<UNode> {
  public abstract proseMirrorMarkName(): string;

  public abstract proseMirrorMarkSpec(): MarkSpec;

  // TODO: Add a check for compatible source nodes
  public abstract modifyUnistNode(
    convertedNode: UnistNode,
    originalMark: Mark
  ): UNode;
}
