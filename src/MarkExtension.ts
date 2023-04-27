import type { Mark, MarkSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { Extension } from "./Extension";

export abstract class MarkExtension extends Extension {
  public abstract proseMirrorMarkName(): string;

  public abstract proseMirrorMarkSpec(): MarkSpec;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Make this generic
  // TODO: Add a for compatible source nodes
  public abstract modifyMdastNode(
    convertedNode: UnistNode,
    originalMark: Mark
  ): UnistNode;
}
