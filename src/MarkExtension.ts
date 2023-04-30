import type { Mark, MarkSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class MarkExtension extends SyntaxExtension {
  public abstract proseMirrorMarkName(): string;

  public abstract proseMirrorMarkSpec(): MarkSpec;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Make this generic
  // TODO: Add a for compatible source nodes
  // TODO: UnistNode is a generic
  public abstract modifyMdastNode(
    convertedNode: UnistNode,
    originalMark: Mark
  ): UnistNode;
}
