import { baseKeymap, chainCommands } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import type { Command, Plugin } from "prosemirror-state";

import type { ExtensionManager } from "./ExtensionManager";

export class KeymapBuilder {
  private readonly keymap: Map<string, Array<Command>>;

  public constructor(extensionManager: ExtensionManager) {
    this.keymap = new Map();
    this.addKeymap(baseKeymap);
    for (const extension of extensionManager.syntaxExtensions()) {
      this.addKeymap(extension.proseMirrorKeymap());
    }
  }

  public build(): Plugin {
    const chainedKeymap: Record<string, Command> = {};
    this.keymap.forEach((commands, key) => {
      chainedKeymap[key] = chainCommands(...commands);
    });
    return keymap(chainedKeymap);
  }

  private addKeymap(map: Record<string, Command>): void {
    for (const key in map) {
      if (!this.keymap.get(key)) {
        this.keymap.set(key, []);
      }
      this.keymap.get(key)!.push(map[key]);
    }
  }
}
