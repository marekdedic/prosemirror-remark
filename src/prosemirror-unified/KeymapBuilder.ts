import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import type { Command, Plugin } from "prosemirror-state";

import type { ExtensionManager } from "./ExtensionManager";

export class KeymapBuilder {
  private readonly keymap: Record<string, Command>;

  public constructor(extensionManager: ExtensionManager) {
    this.keymap = Object.assign(
      baseKeymap,
      ...extensionManager
        .syntaxExtensions()
        .map((extension) => extension.proseMirrorKeymap())
    ) as Record<string, Command>;
  }

  public build(): Plugin {
    return keymap(this.keymap);
  }
}
