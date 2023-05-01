import type { Mark, MarkSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class MarkExtension<
  UNode extends UnistNode
> extends SyntaxExtension<UNode> {
  public unistNodeMatches(node: UnistNode): boolean {
    return node.type === "text";
  }

  public abstract proseMirrorMarkName(): string;

  public abstract proseMirrorMarkSpec(): MarkSpec;

  public abstract modifyUnistNode(
    convertedNode: UnistNode,
    originalMark: Mark
  ): UNode;
}
