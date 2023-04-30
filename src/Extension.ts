import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { ConverterContext } from "./ConverterContext";

export abstract class Extension<Context = {}> {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  public postMdastToProseMirrorHook(
    _context: ConverterContext<Context>
  ): void {}

  public abstract mdastNodeName(): string;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Make this generic
  // TODO: UnistNode is a generic
  // TODO: Specialize schema generic
  public abstract mdastNodeToProseMirrorNodes(
    node: UnistNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema,
    context: ConverterContext<Context>
  ): Array<ProseMirrorNode>;
}
