import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { type Processor, unified } from "unified";
import type { Node as UnistNode } from "unist";

import type { ExtensionManager } from "./ExtensionManager";

export class UnifiedBuilder {
  private readonly extensionManager: ExtensionManager;

  public constructor(extensionManager: ExtensionManager) {
    this.extensionManager = extensionManager;
  }

  public build(): Processor<UnistNode, UnistNode, UnistNode, string> {
    let processor: Processor<UnistNode, UnistNode, UnistNode, string> =
      unified()
        .use(remarkParse)
        .use(remarkStringify, { fences: true, resourceLink: true, rule: "-" });
    for (const extension of this.extensionManager.extensions()) {
      processor = extension.unifiedInitializationHook(processor);
    }
    return processor;
  }
}
