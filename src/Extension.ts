import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

export abstract class Extension {
  public dependencies(): Array<Extension> {
    return [];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor;
  }
}
