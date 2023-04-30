import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { ConverterContext } from "./ConverterContext";

export abstract class Extension {
  // TODO: UnistNode is a generic
  // TODO: Maybe more specific Processor types?
  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor;
  }

  public mdastNodeMatches(node: UnistNode): boolean {
    return node.type === this.mdastNodeName();
  }

  public abstract mdastNodeName(): string;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Make this generic
  // TODO: UnistNode is a generic
  // TODO: Specialize schema generic
  public abstract mdastNodeToProseMirrorNodes(
    node: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema,
    context: ConverterContext
  ): Array<ProseMirrorNode>;

  public postMdastToProseMirrorHook(_context: ConverterContext): void {}
}
