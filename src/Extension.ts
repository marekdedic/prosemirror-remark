import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

export abstract class Extension {
  // TODO: Maybe more specific Processor types?
  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor;
  }
}
