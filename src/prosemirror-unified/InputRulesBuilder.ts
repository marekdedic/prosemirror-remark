import { type InputRule, inputRules } from "prosemirror-inputrules";
import type { Plugin } from "prosemirror-state";

import type { ExtensionManager } from "./ExtensionManager";

export class InputRulesBuilder {
  private readonly rules: Array<InputRule>;

  public constructor(extensionManager: ExtensionManager) {
    this.rules = extensionManager
      .syntaxExtensions()
      .flatMap((extension) => extension.proseMirrorInputRules());
  }

  public build(): Plugin {
    return inputRules({ rules: this.rules });
  }
}
