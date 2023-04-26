import type { MarkSpec } from "prosemirror-model";

import { Extension } from "./Extension";

export abstract class MarkExtension extends Extension {
  public abstract proseMirrorMarkName(): string;

  public abstract proseMirrorMarkSpec(): MarkSpec;
}
