import type { MarkSpec } from "prosemirror-model";

import { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";

export abstract class ProseMirrorRemarkMarkExtension extends ProseMirrorRemarkExtension {
  public abstract proseMirrorMarkName(): string;

  public abstract proseMirrorMarkSpec(): MarkSpec;
}
